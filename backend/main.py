import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from phishy_prompt import generate_prompt
from fastapi.middleware.cors import CORSMiddleware
import boto3
import uuid
from datetime import datetime
from decimal import Decimal #to convert the longtitude and latitute



load_dotenv()

# Frontend to Backend connection
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://phishy-liart.vercel.app/"],  #React dev server & the hosted frontend on vercel
    allow_credentials=True,
    allow_methods=["*"],                     
    allow_headers=["*"],
)

# Set up Google Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# Set up AWS DynamoDB client -- will use logs to give user history, and down the line create a learning model
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("PhishyLogs")

# Request body model
class MessageInput(BaseModel):
    message: str #this is tied to the frontend constant
    userId: str #this is to track user history
    lat: float # the map latitude of user
    lon: float # the longitude of the user





# Function to log analysis result to DynamoDB
def log_to_dynamo(message, confidence, scam_type, reason, user_id, lat, lon):
    rounded_lat = round(float(lat), 1) #offsets the location for about like 11km
    rounded_lon = round(float(lon), 1)
    try:
        table.put_item(Item={
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": message, # items that have been parsed from the Gemini response
            "confidence": confidence,
            "type": scam_type,
            "reason": reason,
            "lat": Decimal(str(rounded_lat)),  # convert float to decimal
            "lon": Decimal(str(rounded_lon))
            
        })
    except Exception as e:
        print("❌ DynamoDB log error:", str(e))


@app.get("/history/{user_id}")
def get_user_history(user_id: str):
    try:
        response = table.scan()
        items = response.get("Items", [])
        user_items = [item for item in items if item.get("userId") == user_id]
        sorted_items = sorted(user_items, key=lambda x: x.get("timestamp", ""), reverse=True)
        return {"items": sorted_items}
    except Exception as e:
        print("❌ Error in history fetch:", str(e))  # log it for debugging
        raise HTTPException(status_code=500, detail="Error loading user scan history.")
    

@app.get("/feed") #showing a community map of the scams taking place (20 of the most recent analysis)
def get_public_feed():
    try:
        response = table.scan()
        all_items = response["Items"]
        sorted_items = sorted(all_items, key=lambda x: x.get("timestamp", ""), reverse=True)

        feed = [{
            "id": item["id"],
            "timestamp": item["timestamp"],
            "message": item["message"],
            "type": item["type"],
            "confidence": item["confidence"],
            "lat": item.get("lat", 0.0),
            "lon": item.get("lon", 0.0)
        } for item in sorted_items[:20]] # 20 of the most recent scams

        return {"feed": feed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/heatmap")
def get_heatmap_data():
    try:
        response = table.scan()
        all_items = response["Items"]

        for item in all_items:
            item["lat"] = round(float(item.get("lat", 0.0)), 2)
            item["lon"] = round(float(item.get("lon", 0.0)), 2)

        freq_map = {}
        for item in all_items:
            key = (item["lat"], item["lon"])
            freq_map[key] = freq_map.get(key, 0) + 1


        max_count = max(freq_map.values(), default=1)

        heat_feed = [
            {
                "lat": lat,
                "lon": lon,
                "intensity": round((count / max_count) * 1.0, 2)  # scaled 0.0–1.0
            }
            for (lat, lon), count in freq_map.items()
        ]

        return {"feed": heat_feed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




# Endpoint for analyzing messages
@app.post("/analyze")
def analyze_message(data: MessageInput): #the message is also recognized as "data"
    try:
        prompt = generate_prompt(data.message) # = data from phishy_prompt.py, therefore can be data.message -- generate_prompt(data.message) gets passed as "prompt" to then be inputted for a response.
        response = model.generate_content(prompt) # model.generate_content is method for Gemini to produce a response. Therfore the production = response.
        result_text = response.text.strip() # we "strip" the response to be recognized by each word so then we can parse through them for results. Identified as "result_text"
        lines = result_text.splitlines() # the results can be outputted as lines in the frontend.

        # Parse expected fields from Gemini response output to user
        confidence = next((line for line in lines if "Confidence:" in line), "Confidence: Unknown")
        scam_type = next((line for line in lines if "Type of scam" in line), "Type of scam: Unknown")
        reason = next((line for line in lines if "Reasoning" in line), "Reasoning: Not provided")
        verdict = next((line for line in lines if "Yes it is a scam" in line or "No it is not a scam" in line), "Scam verdict: Unknown")

        # Clean up values -- values that get stored in table
        confidence_val = confidence.replace("Confidence:", "").strip()
        scam_type_val = scam_type.replace("Type of scam:", "").strip()
        reason_val = reason.replace("Reasoning behind your decision:", "").strip()

        # Log to DynamoDB
        log_to_dynamo(data.message, confidence_val, scam_type_val, reason_val, data.userId, data.lat, data.lon)

        # Return to frontend -- changes the preset values of each category
        return {
            "confidence": confidence_val,
            "type": scam_type_val,
            "reason": reason_val,
            "verdict": verdict.strip()
        }

    except Exception as e:
        print("❌ Error analyzing message:", str(e))
        raise HTTPException(status_code=500, detail=str(e))