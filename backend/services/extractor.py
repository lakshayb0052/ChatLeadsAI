import os
import sys

# Prevent UnicodeEncodeError on Windows when printing emojis
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

import json
import base64
import io
import re
import time
import asyncio
import random
from typing import Optional, Dict, List
from dotenv import load_dotenv
from PIL import Image, ImageEnhance, ImageFilter
from google import genai
import httpx

load_dotenv()

# Configuration removed since we use Gemini Vision directly

def get_system_prompt(text_content: str, context: Optional[str] = None) -> str:
    context_str = f"\nRECENT CONTEXT (Previous messages from this contact):\n{context}" if context else ""
    return f"""
        You are an Expert Lead Generation Agent. Your task is to analyze the provided input (which can be a Text message, an attached Image, or BOTH together) to identify potential leads.
        
        CRITICAL PIPELINE INSTRUCTIONS:
        1. FIRST, analyze the input (both the Text caption/message AND/OR the attached Image simultaneously).
           Specifically, check if the input contains MULTIPLE contact details (such as names, contact/mobile numbers, email addresses, and Application Reference Numbers/ARNs/UTRs/references).
        
        2. Multiple Leads Detection (Spreadsheets, Lists, Images of Multiple Entries, etc.):
           - If the input contains MORE than one lead entry (regardless of whether it is a spreadsheet table, a Google Sheet, a chat transcript screenshot, a list of contacts, or handwritten notes), extract ALL the leads present into a JSON list of objects under the "leads" key.
           - Set "is_excel_screenshot" to true if it is a spreadsheet screenshot, or false if it is not a spreadsheet, but ALWAYS extract ALL leads found.
           - For each lead, extract the name, mobile/contact, email, and ARN/UTR if present.
        
        3. Single Lead Detection:
           - If the input contains only a single lead, set "is_excel_screenshot" to false.
           - Extract the single lead details (name, mobile/contact, email, and ARN) and place it as a single object inside the "leads" list.
           
        4. Valid Lead Criteria:
           - A valid lead MUST contain contact details (either mobile/phone number or email).
           - A mobile/contact is a phone number (e.g., 10-digit mobile number, with or without spaces/dashes/formatting, or with a country/area prefix like +91 82958 86832, 82958 86832, 011 4464 2345).
           - An email is an email address (e.g., matching standard email pattern, gmail, company email).
           - If a lead (or a row in the input) does NOT have at least a mobile number or an email, it is NOT a valid lead and you should set its name, mobile, email, and arn to "absent".
           
        RULES FOR ARN EXTRACTION:
        - Look for an Application Reference Number, UTR Number, Transaction Reference, Submission Reference, or similar sequence (referred to as "ARN" or "UTR").
        - The ARN/UTR is typically a long digit sequence (e.g., 12 to 20 digits, such as 987654321123456 or 98654321234567890).
        - If found, extract the numeric/alphanumeric ARN/UTR. If not found, return "absent".
        
        RULES FOR NAME EXTRACTION:
        - The name MUST be a real person's name or a business owner's name.
        - NEVER extract generic terms, group references, system labels, or irrelevant names. Examples of irrelevant terms to reject as names:
          * Generic titles/greetings: "Dear Students", "Dear All", "Dear Parents", "Dear Candidate", "Hello Team"
          * Process/Heading labels: "Reporting Details", "Announcement", "Notice", "Agenda", "Schedule", "Special PEP", "Coding Test"
          * Roles: "Admin", "Coordinator", "Teacher", "System", "Host", "Moderator"
          * Action/Status words: "Sleeping", "Busy", "Working", "Driving", "Available"
        - If no real, relevant person's name is present, but a contact/email is present, extract the contact/email but return "absent" for the name.
        
        {context_str}
        
        INPUT CONTENT (Message/OCR):
        {text_content}
        
        REQUIRED JSON FIELDS:
        1. is_excel_screenshot: Boolean (true if the image is a screenshot of a spreadsheet with more than one row of data, false otherwise).
        2. leads: A list of lead objects, where each object contains:
           - name: The extracted name of the real person or "absent".
           - mobile: The extracted phone number or "absent".
           - email: The extracted email or "absent".
           - arn: The extracted Application Reference Number (ARN) / UTR or "absent".
        3. lead_score: "Hot/Warm/Cold" (overall score for the interaction).
        4. confidence: 0.0 to 1.0 (overall confidence of extraction).
        
        CRITICAL RULES:
        - You MUST use "absent" for any field not found inside any lead object.
        - Return ONLY a valid JSON object.
        
        JSON FORMAT:
        {{
            "is_excel_screenshot": false,
            "leads": [
                {{
                    "name": "string or \"absent\"",
                    "mobile": "string or \"absent\"",
                    "email": "string or \"absent\"",
                    "arn": "string or \"absent\""
                }}
            ],
            "lead_score": "Hot/Warm/Cold",
            "confidence": 0.0 to 1.0
        }}
    """



class ExtractorService:
    def __init__(self):
        self.provider = os.getenv("AI_PROVIDER", "groq").lower()
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        
        # Load all potential Gemini keys
        self.gemini_api_keys = []
        
        # 1. Check comma-separated GEMINI_API_KEY
        main_key_env = os.getenv("GEMINI_API_KEY", "")
        if main_key_env:
            for k in re.split(r'[;,]', main_key_env):
                k = k.strip()
                if k and k not in self.gemini_api_keys:
                    self.gemini_api_keys.append(k)
        
        # 2. Check individual sequential variables GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
        for i in range(1, 10):
            k = os.getenv(f"GEMINI_API_KEY_{i}")
            if k:
                k = k.strip()
                if k and k not in self.gemini_api_keys:
                    self.gemini_api_keys.append(k)
                    
        self.gemini_api_key = self.gemini_api_keys[0] if self.gemini_api_keys else None
        
        # Initialize clients pool with cooldown tracking
        self.gemini_clients = []
        for idx, key in enumerate(self.gemini_api_keys):
            try:
                masked = key[:6] + "..." + key[-4:] if len(key) > 10 else "..."
                client = genai.Client(api_key=key)
                self.gemini_clients.append({
                    "id": idx + 1,
                    "key": key,
                    "masked": masked,
                    "client": client,
                    "cooldown_until": 0.0
                })
                print(f"✅ Initialized Gemini client #{idx + 1} ({masked})")
            except Exception as e:
                print(f"❌ Failed to initialize Gemini client #{idx + 1}: {e}")
                
        # Backward compatibility for any direct references to gemini_client
        self.gemini_client = self.gemini_clients[0]["client"] if self.gemini_clients else None
        self.client = None

    def _get_available_client(self) -> Optional[Dict]:
        """Returns the first available client that is not on cooldown.
        If all clients are on cooldown, returns the one whose cooldown expires earliest."""
        now = time.time()
        
        # Look for a non-cooldown client
        for c in self.gemini_clients:
            if c["cooldown_until"] <= now:
                return c
                
        # If all on cooldown, find the one with the minimum cooldown time
        if self.gemini_clients:
            c = min(self.gemini_clients, key=lambda x: x["cooldown_until"])
            masked = c["masked"]
            wait_time = max(0.0, c["cooldown_until"] - now)
            print(f"⚠️ All Gemini API keys are on cooldown. Selecting Key #{c['id']} ({masked}) with earliest expiry. Need to wait ~{wait_time:.1f}s if hit again.")
            return c
            
        return None

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
        try:
            combined_text = text_content or ""
            context_str = "\n".join(context_messages) if context_messages else None
            
            if image_bytes:
                print("🔍 Image detected, routing to Vision extraction...")

            if not combined_text.strip() and not context_str and not image_bytes:
                print("ℹ️ Skipping extraction: No content, no context, and no image.")
                return None

            # Try Primary Provider
            result = None
            print(f"🤖 Calling AI Provider: {self.provider}...")
            try:
                if self.provider == "groq":
                    result = await self._extract_groq(combined_text, context_str, image_bytes)
                else:
                    # Default / Fallback to Gemini
                    result = await self._extract_gemini(combined_text, context_str, image_bytes)
            except Exception as e:
                print(f"⚠️ Primary provider failed: {e}")

            # Fallback 1: Groq - If not tried as primary provider
            if not result and self.provider != "groq" and self.groq_api_key:
                print("🔄 Falling back to Groq Vision...")
                try:
                    result = await self._extract_groq(combined_text, context_str, image_bytes)
                except Exception as e:
                    print(f"⚠️ Groq fallback failed: {e}")

            # Fallback 2: Gemini (Free) - Only if not already tried as primary provider
            if not result and self.provider != "gemini" and self.gemini_api_key:
                print("🔄 Falling back to Gemini Vision (Free Tier)...")
                try:
                    result = await self._extract_gemini(combined_text, context_str, image_bytes)
                except Exception as e:
                    print(f"⚠️ Gemini fallback failed: {e}")

            # Final Fallback: Regex Survival Mode
            if not result:
                print("⚠️ All AI providers failed or returned invalid data. Using Regex Survival Mode...")
                full_text_for_regex = f"{context_str}\n{combined_text}" if context_str else combined_text
                result = self._regex_fallback(full_text_for_regex, sender_name)

            # Ensure all required fields are present and clean them
            if result:
                # Check if we have the new 'leads' list format. If not, normalize it.
                if 'leads' not in result or not isinstance(result['leads'], list):
                    # Wrap single lead format into the new leads array format
                    result['is_excel_screenshot'] = result.get('is_excel_screenshot', False)
                    result['leads'] = [{
                        'name': result.get('name', 'absent'),
                        'mobile': result.get('mobile', 'absent'),
                        'email': result.get('email', 'absent'),
                        'arn': result.get('arn', 'absent')
                    }]
                
                # Make sure is_excel_screenshot is a Boolean
                result['is_excel_screenshot'] = bool(result.get('is_excel_screenshot', False))
                
                # Clean each lead inside the list
                cleaned_leads = []
                for lead in result['leads']:
                    if not isinstance(lead, dict):
                        continue
                    
                    l_name = lead.get('name', 'absent')
                    l_mobile = lead.get('mobile', 'absent')
                    l_email = lead.get('email', 'absent')
                    l_arn = lead.get('arn', 'absent')
                    
                    # Sanitize ARN
                    if l_arn != 'absent' and l_arn:
                        clean_arn = re.sub(r'[\s\-:#]', '', str(l_arn))
                        if clean_arn.isalnum() and len(clean_arn) >= 8:
                            l_arn = clean_arn
                        else:
                            l_arn = 'absent'
                    else:
                        l_arn = 'absent'
                    
                    # Validate and clean mobile number
                    if l_mobile != 'absent' and l_mobile:
                        clean_mobile = re.sub(r'\D', '', str(l_mobile))
                        if len(clean_mobile) >= 8:
                            if len(clean_mobile) == 12 and clean_mobile.startswith('91'):
                                l_mobile = clean_mobile[-10:]
                            elif len(clean_mobile) == 11 and clean_mobile.startswith('0'):
                                l_mobile = clean_mobile
                            elif 8 <= len(clean_mobile) <= 15:
                                l_mobile = clean_mobile
                            else:
                                l_mobile = 'absent'
                        else:
                            l_mobile = 'absent'
                    else:
                        l_mobile = 'absent'
                        
                    # Validate email
                    if l_email != 'absent' and l_email:
                        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                        if not re.match(email_pattern, str(l_email)):
                            l_email = 'absent'
                    else:
                        l_email = 'absent'
                    
                    cleaned_leads.append({
                        'name': l_name,
                        'mobile': l_mobile,
                        'email': l_email,
                        'arn': l_arn
                    })
                
                result['leads'] = cleaned_leads
                
                # For backward compatibility, also expose top-level properties using the first lead in the list
                if cleaned_leads:
                    first = cleaned_leads[0]
                    result['name'] = first['name']
                    result['mobile'] = first['mobile']
                    result['email'] = first['email']
                    result['arn'] = first['arn']
                else:
                    result['name'] = 'absent'
                    result['mobile'] = 'absent'
                    result['email'] = 'absent'
                    result['arn'] = 'absent'
                
                print(f"✅ Extraction Complete: is_excel_screenshot={result.get('is_excel_screenshot')}, leads_count={len(result.get('leads', []))}")
            return result
        except Exception as e:
            print(f"❌ Critical Error in extraction pipeline: {e}. Falling back to clean Regex Extraction.")
            try:
                full_text_for_regex = f"{context_str}\n{combined_text}" if context_str else combined_text
                return self._regex_fallback(full_text_for_regex, sender_name)
            except Exception as inner_e:
                print(f"❌ Failed to run Regex fallback: {inner_e}")
                return None

    def _regex_fallback(self, text: str, sender_name: Optional[str] = None) -> Dict:
        # Enhanced regex patterns
        patterns = {
            'mobile': [
                # 1. With country code +91 or 91 and spaces, e.g. +91 82958 86832, 91-82958-86832
                r'\+?91[\s\-]+\d{5}[\s\-]+\d{5}',
                r'\+?91[\s\-]+\d{3,4}[\s\-]+\d{3,4}[\s\-]+\d{3,4}',
                # 2. 10-digit number split in various ways, e.g. 82958 86832, 829-588-6832
                r'\b[6-9]\d{4}[\s\-]+\d{5}\b',
                r'\b[6-9]\d{2}[\s\-]+\d{3}[\s\-]+\d{4}\b',
                r'\b[6-9]\d{2}[\s\-]+\d{4}[\s\-]+\d{3}\b',
                # 3. Landline formats, e.g. 011 4464 2345, 011-4464-2345
                r'\b0\d{2,4}[\s\-]+\d{3,4}[\s\-]+\d{3,4}\b',
                # 4. Standard contiguous formats with optional country/area prefixes
                r'(?:\+91|91|0)?[6-9][\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d',
                r'[6-9]\d{9}',
                r'\b\d{10}\b',
                r'\b\d{8,11}\b'
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
            ],
            'arn': [
                r'(?:arn|arn\s+no|reference\s+number|application\s+reference|ref\s+no)[\s.:#\-]*(\d{10,20})',
                r'\b\d{12,20}\b'
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
                if len(digits) >= 8:
                    # If it's a standard Indian mobile number (e.g. starts with country code 91 and has 12 digits), normalize to 10 digits
                    if len(digits) == 12 and digits.startswith('91'):
                        mobile = digits[-10:]
                    # If it starts with 0 and has 11 digits (like standard STD landlines 011 4464 2345), keep all 11 digits
                    elif len(digits) == 11 and digits.startswith('0'):
                        mobile = digits
                    # Otherwise keep the full cleaned digits if it's 8 to 15 digits
                    elif 8 <= len(digits) <= 15:
                        mobile = digits
                    else:
                        continue
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

        # Extract ARN
        arn = "absent"
        for pattern in patterns['arn']:
            matches = re.findall(pattern, clean_text, re.IGNORECASE)
            if matches:
                m = matches[0]
                digits = re.sub(r'\D', '', m)
                if len(digits) >= 8:
                    arn = digits
                    break

        # NEW RULE: If neither mobile nor email are present, immediately reject as not a valid lead!
        if mobile == "absent" and email == "absent":
            return {
                "name": "absent",
                "mobile": "absent",
                "email": "absent",
                "arn": "absent",
                "lead_score": "Cold",
                "confidence": 0.0
            }

        
        # List of common words/phrases that are NOT names (Blacklist)
        blacklist = [
            "sleeping", "busy", "working", "driving", "available", "hello", "hi", "hey", "hlo", 
            "dear", "sir", "madam", "the", "this", "that", "ok", "okay", "yes", "no", "sure", 
            "thanks", "thank", "good", "fine", "bye", "please", "pls", "well", "cool", "done", 
            "perfect", "yep", "yeah", "incoming", "outgoing", "message", "students", "student", 
            "teacher", "details", "reporting", "special", "coding", "test", "summer", "term", 
            "announcement", "notice", "alert", "attention", "regards", "group", "admin", "joined", 
            "left", "added", "removed", "created", "whatsapp", "class", "session", "dashboard"
        ]

        def is_valid_name(val: str) -> bool:
            if not val or len(val) < 2 or len(val) > 40:
                return False
            val_lower = val.lower()
            # If any blacklisted word is a substring of the name, or matches fully
            for word in blacklist:
                if word == val_lower or (len(word) > 4 and word in val_lower):
                    return False
            return True
        
        # Extract name
        name = "absent"
        # Try business card style (all caps lines)
        lines = [l.strip() for l in clean_text.split('\n') if len(l.strip()) > 3]
        for line in lines[:5]:
            if len(re.findall(r'\d', line)) > 3 or '@' in line:
                continue
            # Check if it's all caps or title case
            if sum(1 for c in line if c.isupper()) / len(line) > 0.5:
                candidate = line.title()
                if is_valid_name(candidate):
                    name = candidate
                    break
            # Check if it contains typical name patterns
            if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$', line):
                if is_valid_name(line):
                    name = line
                    break
        
        if name == "absent":
            # 1. Try to find name with prefix (I am, My name is, etc.)
            for pattern in patterns['name']:
                match = re.search(pattern, clean_text) 
                if match:
                    extracted = match.group(1).strip()
                    if is_valid_name(extracted):
                        name = extracted
                        break
            
            # 2. If still absent, try to catch a Title Case name at the very beginning of the message
            if name == "absent":
                # Look for 1-3 Title Case words at the start, e.g., "Lucky." or "Lucky Kumar"
                start_match = re.match(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})[\s.,]', clean_text)
                if start_match:
                    extracted = start_match.group(1).strip()
                    if is_valid_name(extracted):
                        name = extracted
        
        # If no name found, strictly return "absent" as requested
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
            "arn": arn,
            "lead_score": lead_score,
            "confidence": confidence
        }



    async def _extract_groq(self, text: str, context: Optional[str] = None, image_bytes: Optional[bytes] = None) -> Dict:
        api_key = self.groq_api_key
        if not api_key:
            print("❌ No Groq API key available.")
            return None

        prompt = get_system_prompt(text, context)
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Build contents array in OpenAI Vision format
        content_items = [{"type": "text", "text": prompt}]
        
        if image_bytes:
            try:
                import base64
                encoded = base64.b64encode(image_bytes).decode('utf-8')
                content_items.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoded}"
                    }
                })
                print("🖼️ Groq Vision: Encoding image for extraction...")
            except Exception as e:
                print(f"❌ Failed to encode image for Groq: {e}")

        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": content_items
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        
        # Call Groq API with 3 retries and exponential backoff
        max_retries = 3
        retry_delay = 2.0
        
        for attempt in range(max_retries + 1):
            try:
                print(f"🤖 Groq API: Extracting data using meta-llama/llama-4-scout-17b-16e-instruct (attempt {attempt + 1}/{max_retries + 1})...")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                
                if response.status_code == 200:
                    res_json = response.json()
                    ai_response = res_json["choices"][0]["message"]["content"]
                    print("✅ Groq API call succeeded.")
                    return self._parse_ai_json(ai_response)
                
                elif response.status_code == 429:
                    print(f"⚠️ Groq Rate Limited (429): {response.text}")
                    if attempt == max_retries:
                        break
                    wait_sec = retry_delay * (2 ** attempt) + random.uniform(0.0, 1.0)
                    print(f"⏳ Sleeping for {wait_sec:.2f}s before retry...")
                    await asyncio.sleep(wait_sec)
                else:
                    print(f"❌ Groq API returned status {response.status_code}: {response.text}")
                    break
            except Exception as e:
                print(f"❌ Groq Connection Error: {e}")
                if attempt == max_retries:
                    break
                await asyncio.sleep(2.0)
                
        return None



    async def _extract_gemini(self, text: str, context: Optional[str] = None, image_bytes: Optional[bytes] = None) -> Dict:
        if not self.gemini_clients:
            print("❌ No initialized Gemini API keys available.")
            return None

        prompt = get_system_prompt(text, context)
        contents = [prompt]
        
        if image_bytes:
            try:
                contents.append(Image.open(io.BytesIO(image_bytes)))
            except Exception as e:
                print(f"❌ Failed to parse image bytes for Gemini: {e}")

        max_retries = 3
        retry_delay = 3.0  # Base delay for exponential backoff
        
        for attempt in range(max_retries + 1):
            client_info = self._get_available_client()
            if not client_info:
                print("❌ No Gemini client available.")
                return None
                
            client_id = client_info["id"]
            masked_key = client_info["masked"]
            client = client_info["client"]
            
            # Check if client is still under cooldown (only possible if all keys are on cooldown)
            now = time.time()
            if client_info["cooldown_until"] > now:
                wait_sec = client_info["cooldown_until"] - now
                # FAIL FAST: If wait time is too long, fail immediately to prevent task backlog
                if wait_sec > 3.0:
                    print(f"⚠️ Cooldown is too long ({wait_sec:.2f}s) for Key #{client_id}. Failing fast to prevent backlog and trigger fallback immediately.")
                    return None
                print(f"⏳ Sleeping for {wait_sec:.2f}s because all keys are rate-limited...")
                await asyncio.sleep(wait_sec)
            
            try:
                if image_bytes:
                    print(f"🖼️ Gemini Vision: Analyzing image content using Key #{client_id} ({masked_key})...")
                else:
                    print(f"🤖 Gemini: Extracting data using Key #{client_id} ({masked_key})...")
                
                # Make the API call in run_in_executor to prevent blocking the event loop
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=contents
                    )
                )
                
                # Success! Clear cooldown for this key
                client_info["cooldown_until"] = 0.0
                return self._parse_ai_json(response.text)
                
            except Exception as e:
                err_msg = str(e)
                print(f"Gemini Error (Key #{client_id} / {masked_key}): {err_msg}")
                
                # Identify if it is a rate limit / 429 error
                is_429 = "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "rate" in err_msg.lower() or "quota" in err_msg.lower()
                
                if is_429:
                    # Detect Daily Free-Tier Quota exhaustion
                    is_daily_exhausted = "exceeded your current quota" in err_msg.lower() or "free_tier_requests" in err_msg.lower() or "daily" in err_msg.lower()
                    
                    if is_daily_exhausted:
                        cooldown_duration = 3600.0  # 1 hour
                        client_info["cooldown_until"] = time.time() + cooldown_duration
                        print(f"⚠️ Key #{client_id} ({masked_key}) hit daily free-tier quota limits. Cooldown active for {cooldown_duration}s. Skipping retries.")
                        break  # Break retry loop immediately as it won't succeed today!
                    else:
                        # Place key on standard 60-second cooldown
                        cooldown_duration = 60.0
                        client_info["cooldown_until"] = time.time() + cooldown_duration
                        print(f"⚠️ Key #{client_id} ({masked_key}) hit rate limits. Cooldown active for {cooldown_duration}s.")
                    
                    # If we have other keys that are not on cooldown, rotate and retry immediately!
                    active_keys = [c for c in self.gemini_clients if c["cooldown_until"] <= time.time()]
                    if active_keys:
                        print(f"🔄 Rotating to the next available key immediately (attempt {attempt + 1}/{max_retries + 1})...")
                        continue
                
                # If it's the last attempt, don't sleep
                if attempt == max_retries:
                    print("❌ Max retries reached for Gemini. Failing extraction.")
                    break
                    
                # Backoff delay calculation: base * 2^attempt + random jitter (0 to 1s)
                current_delay = (retry_delay * (2 ** attempt)) + random.uniform(0.0, 1.0)
                print(f"⏳ Sleeping for {current_delay:.2f}s (backoff retry {attempt + 1}/{max_retries})...")
                await asyncio.sleep(current_delay)
                
        return None

extractor = ExtractorService()