import os
import json
import base64
import io
import re
from typing import Optional, Dict, List
from dotenv import load_dotenv
import ollama
from PIL import Image, ImageEnhance, ImageFilter
from google import genai

load_dotenv()

# Configuration removed since we use Gemini Vision directly

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
        self.provider = os.getenv("AI_PROVIDER", "gemini").lower()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
                
        if self.gemini_api_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_api_key)
            except Exception as e:
                print(f"Failed to initialize Gemini: {e}")

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
            print("🔍 Image detected, routing to Gemini Vision...")
            # We skip local OCR (Tesseract) because Gemini 2.5 Flash has native, state-of-the-art vision and OCR capabilities built-in.

        if not combined_text.strip() and not context_str and not image_bytes:
            print("ℹ️ Skipping extraction: No content, no context, and no image.")
            return None

        # Try Primary Provider
        result = None
        print(f"🤖 Calling AI Provider: {self.provider}...")
        if self.provider == "gemini":
            result = await self._extract_gemini(combined_text, context_str, image_bytes)
        else:
            result = await self._extract_ollama(combined_text, context_str)

        # Fallback 1: Gemini (Free)
        if not result and self.gemini_api_key:
            print("🔄 Falling back to Gemini Vision (Free Tier)...")
            result = await self._extract_gemini(combined_text, context_str, image_bytes)

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



    async def _extract_gemini(self, text: str, context: Optional[str] = None, image_bytes: Optional[bytes] = None) -> Dict:
        try:
            prompt = get_system_prompt(text, context)
            contents = [prompt]
            
            if image_bytes:
                contents.append(Image.open(io.BytesIO(image_bytes)))
                print("🖼️ Gemini Vision: Analyzing image content...")

            response = self.gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents
            )
            return self._parse_ai_json(response.text)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return None

extractor = ExtractorService()