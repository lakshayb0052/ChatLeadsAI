import os
import json
import base64
import io
import re
from typing import Optional, Dict, List
from openai import OpenAI
from dotenv import load_dotenv
import ollama
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

load_dotenv()

# Configure Tesseract path for Windows
if os.name == 'nt':
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path

def get_system_prompt(text_content: str, context: Optional[str] = None) -> str:
    context_str = f"\nRECENT CONTEXT (Previous messages from this contact):\n{context}" if context else ""
    return f"""
        You are an Expert Lead Generation Agent. Your task is to analyze the provided input (Text or Image) to identify a potential lead.
        
        STEP-BY-STEP PROCESS FOR IMAGES:
        1. Read every single word and number visible in the image (especially if it's a business card).
        2. From that complete content, identify the most likely:
           - Name of the person or business owner.
           - 10-digit mobile number.
           - Email address (gmail, company mail, etc).
        
        STEP-BY-STEP PROCESS FOR TEXT:
        1. Analyze the message and context to find the Name, Mobile, and Email.
        
        {context_str}
        
        INPUT CONTENT (Message/OCR):
        {text_content}
        
        REQUIRED JSON FIELDS:
        1. name: The extracted name or "absent".
        2. mobile: The extracted 10-digit number or "absent".
        3. email: The extracted email or "absent".
        
        CRITICAL RULES:
        - If you see a business card, the "name" should be the person's name on the card.
        - You MUST use "absent" for any field not found.
        - Return ONLY a valid JSON object.
        
        JSON FORMAT:
        {{
            "name": "string or \"absent\"",
            "mobile": "string or \"absent\"",
            "email": "string or \"absent\"",
            "lead_score": "Hot/Warm/Cold",
            "confidence": 0.0 to 1.0
        }}
    """

class ExtractorService:
    def __init__(self):
        self.provider = os.getenv("AI_PROVIDER", "ollama").lower()
        if self.provider == "openai":
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def _parse_ai_json(self, content: str) -> Optional[Dict]:
        """Extracts and parses JSON from AI response with high tolerance."""
        try:
            # Try direct load first
            return json.loads(content)
        except:
            try:
                # Look for { ... } block
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    json_str = match.group(0)
                    # Replace single quotes with double quotes if needed
                    json_str = re.sub(r"'([^']*)'", r'"\1"', json_str)
                    return json.loads(json_str)
            except Exception as e:
                print(f"JSON Parse Error: {e} | Content: {content[:100]}...")
        return None

    async def extract_lead_data(self, text_content: Optional[str] = None, image_bytes: Optional[bytes] = None, sender_name: Optional[str] = None, context_messages: Optional[List[str]] = None) -> Dict:
        combined_text = text_content or ""
        context_str = "\n".join(context_messages) if context_messages else None
        
        if image_bytes:
            print("🔍 Processing image for OCR...")
            try:
                # Enhanced image preprocessing
                image = Image.open(io.BytesIO(image_bytes))
                
                # Convert to RGB if needed
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Multiple preprocessing steps for better OCR
                # 1. Convert to grayscale
                gray = image.convert('L')
                
                # 2. Enhance contrast
                enhancer = ImageEnhance.Contrast(gray)
                enhanced = enhancer.enhance(2.0)
                
                # 3. Apply sharpening filter
                sharpened = enhanced.filter(ImageFilter.SHARPEN)
                
                # 4. Increase resolution if too small
                if sharpened.size[0] < 1000:
                    new_size = (sharpened.size[0] * 2, sharpened.size[1] * 2)
                    sharpened = sharpened.resize(new_size, Image.Resampling.LANCZOS)
                
                # Try OCR with different configurations
                ocr_texts = []
                
                # Configuration 1: Standard
                config1 = '--psm 6 --oem 3'
                text1 = pytesseract.image_to_string(sharpened, config=config1)
                if text1.strip():
                    ocr_texts.append(text1)
                
                # Configuration 2: Treat image as a single text block
                config2 = '--psm 7 --oem 3'
                text2 = pytesseract.image_to_string(sharpened, config=config2)
                if text2.strip():
                    ocr_texts.append(text2)
                
                # Configuration 3: Sparse text
                config3 = '--psm 11 --oem 3'
                text3 = pytesseract.image_to_string(sharpened, config=config3)
                if text3.strip():
                    ocr_texts.append(text3)
                
                # Combine all OCR results with highest confidence
                ocr_text = "\n".join(ocr_texts)
                
                if ocr_text.strip():
                    print(f"✅ OCR Success: Extracted {len(ocr_text)} characters.")
                    print(f"--- OCR CONTENT START ---\n{ocr_text}\n--- OCR CONTENT END ---")
                    combined_text += f"\n[IMAGE OCR CONTENT]:\n{ocr_text}"
                else:
                    print("⚠️ OCR returned no text.")
            except Exception as e:
                print(f"❌ OCR Error: {e}")

        if not combined_text.strip() and not context_str and not image_bytes:
            print("ℹ️ Skipping extraction: No content, no context, and no image.")
            return None

        # Try Primary Provider
        result = None
        print(f"🤖 Calling AI Provider: {self.provider}...")
        if self.provider == "openai":
            result = await self._extract_openai(combined_text, context_str, image_bytes)
        else:
            result = await self._extract_ollama(combined_text, context_str)

        # Fallback to OpenAI if primary failed
        if not result and self.provider != "openai" and os.getenv("OPENAI_API_KEY"):
            if os.getenv("OPENAI_API_KEY") != "optional_if_provider_is_openai":
                print("🔄 Primary provider failed, falling back to OpenAI Vision...")
                result = await self._extract_openai(combined_text, context_str, image_bytes)

        # Final Fallback: Regex Survival Mode
        if not result:
            print("⚠️ All AI providers failed or returned invalid data. Using Regex Survival Mode...")
            full_text_for_regex = f"{context_str}\n{combined_text}" if context_str else combined_text
            result = self._regex_fallback(full_text_for_regex, sender_name)

        # Ensure all required fields are present
        if result:
            # Mark absent fields
            result['name'] = result.get('name', 'absent')
            result['mobile'] = result.get('mobile', 'absent')
            result['email'] = result.get('email', 'absent')
            
            # Validate and clean mobile number
            if result['mobile'] != 'absent':
                # Clean to only digits
                clean_mobile = re.sub(r'\D', '', str(result['mobile']))
                # Take last 10 digits
                if len(clean_mobile) >= 10:
                    result['mobile'] = clean_mobile[-10:]
                else:
                    result['mobile'] = 'absent'
            
            # Validate email
            if result['email'] != 'absent':
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_pattern, result['email']):
                    result['email'] = 'absent'
            
            print(f"✅ Extraction Complete: Name={result.get('name')}, Mobile={result.get('mobile')}, Email={result.get('email')}, Confidence={result.get('confidence')}")
        return result

    def _regex_fallback(self, text: str, sender_name: Optional[str] = None) -> Dict:
        # Enhanced regex patterns
        patterns = {
            'mobile': [
                r'(?:\+91|91|0)?[6-9][\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d',
                r'[6-9]\d{9}',
                r'\b\d{10}\b'
            ],
            'email': [
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
                r'[a-zA-Z0-9._%+-]+@gmail\.com',
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu)'
            ],
            'name': [
                r'(?:I am|My name is|Name:?|This is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                r'(?:Hi|Hello|Hey),?\s+(?:this is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$'
            ]
        }
        
        # Clean text
        clean_text = text.replace('|', 'I').replace('0gmail', '@gmail')
        clean_text = re.sub(r'[^\w\s@\.\-]', ' ', clean_text)
        
        # Extract mobile
        mobile = "absent"
        for pattern in patterns['mobile']:
            matches = re.findall(pattern, clean_text)
            for m in matches:
                digits = re.sub(r'\D', '', m)
                if len(digits) >= 10:
                    mobile = digits[-10:]
                    break
            if mobile != "absent":
                break
        
        # Extract email
        email = "absent"
        for pattern in patterns['email']:
            matches = re.findall(pattern, clean_text, re.IGNORECASE)
            if matches:
                email = matches[0].lower()
                break
        
        # Extract name
        name = "absent"
        # Try business card style (all caps lines)
        lines = [l.strip() for l in clean_text.split('\n') if len(l.strip()) > 3]
        for line in lines[:5]:
            if len(re.findall(r'\d', line)) > 3 or '@' in line:
                continue
            # Check if it's all caps or title case
            if sum(1 for c in line if c.isupper()) / len(line) > 0.5:
                name = line.title()
                break
            # Check if it contains typical name patterns
            if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$', line):
                name = line
                break
        
        if name == "absent":
            # List of common words/phrases that are NOT names (Blacklist)
            blacklist = ["sleeping", "busy", "working", "driving", "available", "hello", "hi", "hey", "hlo", "dear", "sir", "madam", "the", "this", "that"]
            
            # 1. Try to find name with prefix (I am, My name is, etc.)
            for pattern in patterns['name']:
                match = re.search(pattern, clean_text) 
                if match:
                    extracted = match.group(1).strip()
                    if not any(word in extracted.lower() for word in blacklist):
                        name = extracted
                        break
            
            # 2. If still absent, try to catch a Title Case name at the very beginning of the message
            if name == "absent":
                # Look for 1-3 Title Case words at the start, e.g., "Lucky." or "Lucky Kumar"
                start_match = re.match(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})[\s.,]', clean_text)
                if start_match:
                    extracted = start_match.group(1).strip()
                    if not any(word in extracted.lower() for word in blacklist):
                        name = extracted
        
        # If no name found, strictly return "absent" as requested (sender_name is already None from caller)
        if name == "absent":
            name = "absent"

        # Calculate lead score
        lead_score = "Cold"
        confidence = 0.3
        
        if email != "absent" and mobile != "absent":
            lead_score = "Hot"
            confidence = 0.9
        elif email != "absent" or mobile != "absent":
            lead_score = "Warm"
            confidence = 0.7
        elif name != "absent":
            lead_score = "Warm"
            confidence = 0.5

        return {
            "name": name,
            "mobile": mobile,
            "email": email,
            "lead_score": lead_score,
            "confidence": confidence
        }

    async def _extract_ollama(self, text: str, context: Optional[str] = None) -> Dict:
        try:
            prompt = get_system_prompt(text, context)
            response = ollama.generate(model='llama3', prompt=prompt, options={'num_predict': 200})
            return self._parse_ai_json(response['response'])
        except Exception as e:
            print(f"Ollama Error: {e}")
            return None

    async def _extract_openai(self, text: str, context: Optional[str] = None, image_bytes: Optional[bytes] = None) -> Dict:
        try:
            prompt = get_system_prompt(text, context)
            
            messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
            
            if image_bytes:
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                messages[0]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                })
                print("🖼️ OpenAI Vision: Sending image for direct analysis...")

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using mini for faster response
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=300
            )
            return self._parse_ai_json(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return None

extractor = ExtractorService()