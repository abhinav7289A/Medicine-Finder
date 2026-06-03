import requests
import re

def extract_unit_count(quantity_string: str) -> int:
    if not quantity_string:
        print("DEBUG: Quantity string is empty, defaulting to 1")
        return 1
        
    match = re.search(r'\d+', quantity_string)
    if match:
        count = int(match.group())
        print(f"DEBUG: Regex found '{count}' inside string '{quantity_string}'")
        return count if count > 0 else 1
    
    print(f"DEBUG: Regex failed to find a number in '{quantity_string}'")
    return 1

def fetch_live_branded_price(medicine_name: str) -> float:
    print(f"\n--- SCRAPER STARTING FOR: {medicine_name} ---")
    url = f"https://pharmeasy.in/api/search/search/?q={medicine_name}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://pharmeasy.in/"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"DEBUG: API Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("data", {}).get("products", [])
            
            if not products:
                print("DEBUG: API returned 200 OK, but 'products' array is empty.")
                print(f"RAW JSON DUMP (First 200 chars): {str(data)[:200]}")
                return 0.0
                
            top_match = products[0]
            print(f"DEBUG: Found top match: {top_match.get('name', 'Unknown')}")
            
            total_mrp = float(top_match.get("mrp", 0.0))
            print(f"DEBUG: Extracted Total MRP: {total_mrp}")
            
            qty_string = top_match.get("productQty", "")
            if not qty_string:
                qty_string = top_match.get("packForm", "")
            
            unit_count = extract_unit_count(qty_string)
            
            if unit_count > 0:
                price_per_unit = total_mrp / unit_count
                print(f"DEBUG: SUCCESS! {total_mrp} / {unit_count} = {price_per_unit}")
                return round(price_per_unit, 2)
            else:
                print("DEBUG: Unit count was 0, returning 0.0 to prevent division by zero.")
                return 0.0
                
        else:
            print(f"DEBUG: Request failed. Website returned: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"DEBUG: Network/Timeout Error: {e}")
    
    print("--- SCRAPER FINISHED WITH NO DATA ---")
    return 0.0