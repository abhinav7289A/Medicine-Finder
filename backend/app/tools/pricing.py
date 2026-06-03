import os
import json
from google import genai
from google.genai import types

def fetch_batch_branded_prices(medicine_names: list) -> dict:
    print(f"\n--- BATCH PRICING STARTING FOR: {medicine_names} ---")
    
    if not medicine_names:
        print("DEBUG: Medicine list is empty. Returning {}.")
        return {}

    # 1. Check API Key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("CRITICAL ERROR: GEMINI_API_KEY is not set in your environment variables!")
        return {name: 0.0 for name in medicine_names}
        
    try:
        # 2. Initialize the NEW GenAI Client
        client = genai.Client(api_key=api_key)
        print("DEBUG: Gemini Client initialized successfully.")
        
        prompt = f"""
        You are a pharmaceutical pricing expert in India with web access.
        I need the average market MRP for a SINGLE UNIT (e.g., 1 tablet, 1 capsule, 1 ml) for the following branded medicines:
        {medicine_names}

        Task:
        1. Search the live web for the current Indian pharmacy prices of these brands.
        2. Divide the total pack price by the package size to get the EXACT PER UNIT PRICE in INR.
        
        Output Format:
        Return ONLY a valid, raw JSON object. Do not include markdown tags like ```json.
        Keys must be the exact medicine names provided. Values must be the floating-point prices.
        If you absolutely cannot find a price, return 0.0 for that key.
        
        Example: {{"Telma 40": 8.50, "Dolo 650": 2.14}}
        """
        
        print("DEBUG: Sending prompt to Gemini with Google Search tool...")
        
        # 3. New SDK format for calling the model and enabling Search Grounding
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],  # The new correct tool name
                temperature=0.1 # Keep it low for strict JSON output
            )
        )
        
        # 4. Inspect Raw LLM Output
        raw_text = response.text
        print("\n--- RAW GEMINI RESPONSE ---")
        print(raw_text)
        print("---------------------------\n")
        
        # 5. Clean and Parse JSON
        cleaned_json_string = raw_text.replace("```json", "").replace("```", "").strip()
        print(f"DEBUG: Cleaned string ready for parsing: {cleaned_json_string}")
        
        prices = json.loads(cleaned_json_string)
        print(f"DEBUG: Successfully parsed JSON: {prices}")
        
        # 6. Safety Verification (Ensure all requested keys are present)
        final_prices = {}
        for name in medicine_names:
            final_prices[name] = float(prices.get(name, 0.0))
            
        print(f"--- BATCH PRICING COMPLETE: {final_prices} ---")
        return final_prices

    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON Parsing Failed! The LLM likely returned conversational text. Error: {e}")
        return {name: 0.0 for name in medicine_names}
    except Exception as e:
        print(f"DEBUG: Gemini API Error: {e}")
        return {name: 0.0 for name in medicine_names}