import os
import re
import json
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from groq import Groq

# --- ENVIRONMENT SETUP ---
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir)) 
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

pc = Pinecone(api_key=PINECONE_API_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

try:
    generic_index = pc.Index("medicine-db")
    brand_index = pc.Index("medicine-brands")
except Exception as e:
    print(f"❌ Error connecting to Pinecone: {e}")

# Running locally on RTX 3050Ti
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- HELPERS ---
def extract_dosage_numbers(text):
    matches = re.findall(r'(\d+)\s?(?:mg|g|ml|mcg|iu)?', text, re.IGNORECASE)
    return [m for m in matches if m.isdigit()]

def extract_base_ingredients(salt_text):
    components = re.split(r'\+|and|&|,', salt_text, flags=re.IGNORECASE)
    base_ingredients = []
    for comp in components:
        clean_comp = re.sub(r'\b\d+\.?\d*\s*(?:mg|g|ml|mcg|iu|gm|%|w/v|w/w)?\b', '', comp, flags=re.IGNORECASE)
        clean_comp = re.sub(r'[\(\)]', '', clean_comp).strip()
        words = clean_comp.split()
        if words:
            base_ingredients.append(words[0].lower())
    return list(set(base_ingredients))

def extract_unit_quantity(unit_size_str):
    if not unit_size_str: return 1.0
    match_strip = re.search(r'(\d+)\s*\'?s\b', str(unit_size_str), re.IGNORECASE)
    if match_strip: return float(match_strip.group(1))
    match_num = re.search(r'(\d+\.?\d*)', str(unit_size_str))
    return float(match_num.group(1)) if match_num else 1.0

# --- GROQ VERIFIER ---
def verify_safety_with_groq(original_query, generic_name, salt_composition):
    
    # 1. The strict rules and schema (System Role)
    system_prompt = """
    You are a strict, highly accurate AI Pharmacist. Your job is to verify if a suggested generic medicine is a 100% safe substitute for a branded prescription.
    
    You must execute a 3-Point Logic Pass:
    1. Chemical Parity: Do the Active Pharmaceutical Ingredients (APIs) match exactly?
    2. Dosage Alignment: Are the mg/mcg values identical?
    3. Formulation Equivalence: Do the release mechanisms match (e.g., Extended Release vs Immediate Release)?
    
    If ALL three match, it is safe. If ANY fail, it is unsafe.
    
    You MUST output valid JSON ONLY.
    Schema:
    {
      "is_safe": boolean,
      "reason": "String explaining the chemical/dosage logic concisely.",
      "suggested_alternative": "String (If unsafe, what generic SHOULD they buy? If safe, return null)"
    }
    """
    
    # 2. The dynamic data for this specific query (User Role)
    user_prompt = f"""
    Original Branded Prescription: '{original_query}'
    Suggested Generic Alternative: '{generic_name}'
    Generic Composition: '{salt_composition}'
    
    Execute the 3-Point Logic Pass and determine if this is a safe substitution.
    """
    
    try:
        print(f"🤖 Verifying with Llama 3.3-70B for '{original_query}'...")
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.0, # Forces deterministic, non-creative token generation
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"❌ Groq Error: {e}")
        # Fail-Safe: If the API times out, default to unsafe to protect the patient
        return {
            "is_safe": False, 
            "reason": "Internal verification system error. Please consult a doctor.", 
            "suggested_alternative": None
        }

# --- SEARCH LOGIC ---
def get_salt_from_brand(brand_query: str):
    target_numbers = extract_dosage_numbers(brand_query)
    query_embedding = model.encode(brand_query).tolist()
    results = brand_index.query(vector=query_embedding, top_k=10, include_metadata=True)
    
    best_match = results['matches'][0] if results['matches'] else None
    if not best_match or best_match['score'] < 0.5:
        return None, target_numbers, extract_base_ingredients(brand_query)

    raw_salt = best_match['metadata'].get('salt_composition')
    target_ingredients = extract_base_ingredients(raw_salt)
    real_dosages = extract_dosage_numbers(raw_salt)
    return raw_salt, real_dosages, target_ingredients

def find_cheapest_generic(query_text: str):
    try:
        search_term, target_dosages, target_ingredients = get_salt_from_brand(query_text)
        search_term = search_term if search_term else query_text
        query_embedding = model.encode(search_term).tolist()
        results = generic_index.query(vector=query_embedding, top_k=15, include_metadata=True)
        
        matches = []
        for match in results['matches']:
            data = match['metadata']
            g_name = data.get("generic_name", "Unknown").lower()
            is_comb = all(ing in g_name for ing in target_ingredients) if target_ingredients else True
            is_dos = all(d in g_name for d in target_dosages) if target_dosages else True
            
            mrp = float(data.get("mrp", 0.0))
            qty = extract_unit_quantity(data.get("unit_size", "1"))
            price_unit = mrp / qty if qty > 0 else mrp
            
            matches.append({
                "generic_name": data.get("generic_name"),
                "mrp": mrp,
                "unit_size": data.get("unit_size"),
                "price_per_unit": round(price_unit, 2),
                "is_exact_dosage": is_dos,
                "is_combination_match": is_comb
            })

        sorted_matches = sorted(matches, key=lambda x: (not x['is_combination_match'], not x['is_exact_dosage'], x['price_per_unit']))
        best = sorted_matches[0] if sorted_matches else None
        
        verification = None
        if best:
            verification = verify_safety_with_groq(query_text, best["generic_name"], search_term)

        return {
            "original_query": query_text,
            "best_match": best,
            "alternatives": sorted_matches[1:4],
            "verification": verification
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return None