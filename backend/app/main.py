# app/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.tools.database import find_cheapest_generic
from app.tools.ocr import extract_medicine_from_image

# Import our new batched Gemini tool
from app.tools.pricing import fetch_batch_branded_prices

app = FastAPI(title="Medicine Finder API")

@app.get("/")
def home():
    return {
        "status": "online", 
        "message": "AI Pharmacist Backend is running!",
        "models": ["all-MiniLM-L6-v2", "Llama 3.3 70B", "Gemini 2.5 Flash"]
    }

class MedicineQuery(BaseModel):
    query: str

@app.post("/search")
def search_medicine(payload: MedicineQuery):
    queries = [q.strip() for q in payload.query.split(",") if q.strip()]
    results = []
    successful_queries = []
    
    # Phase 1: Semantic Search & Agentic Verification
    for name in queries:
        data = find_cheapest_generic(name)
        if data:
            results.append(data)
            if "error" not in data:
                successful_queries.append(name)
                
    # Phase 2: Orchestrated Batch Pricing (1 API Call)
    batch_prices = fetch_batch_branded_prices(successful_queries)
    
    # Phase 3: Merge market data into the payload
    for res in results:
        if "error" not in res:
            query_name = res["original_query"]
            res["market_data"] = {
                "branded_mrp": batch_prices.get(query_name, 0.0)
            }
            
    return {"results": results}

@app.post("/vision-search")
async def search_medicine_from_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    ocr_result = extract_medicine_from_image(image_bytes, file.content_type)
    if not ocr_result.get("success"):
        raise HTTPException(status_code=400, detail="OCR Failed")

    final_results = []
    successful_queries = []
    
    # Phase 1: Semantic Search & Agentic Verification
    for query in ocr_result["queries"]:
        data = find_cheapest_generic(query)
        if data:
            final_results.append(data)
            if "error" not in data:
                successful_queries.append(query)

    # Phase 2: Orchestrated Batch Pricing (1 API Call)
    batch_prices = fetch_batch_branded_prices(successful_queries)

    # Phase 3: Merge market data into the payload
    for res in final_results:
        if "error" not in res:
            query_name = res["original_query"]
            res["market_data"] = {
                "branded_mrp": batch_prices.get(query_name, 0.0)
            }

    return {
        "prescription_count": len(ocr_result["queries"]), 
        "results": final_results
    }