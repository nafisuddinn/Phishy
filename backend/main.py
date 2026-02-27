import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from phishy_prompt import generate_prompt

load_dotenv()

# Frontend to Backend connection
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://phishy-liart.vercel.app",
    ],  # React dev server & hosted frontend on vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up Google Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
model = None
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

# Set up AWS DynamoDB client -- use logs for history and community feeds
DYNAMO_TABLE_NAME = os.getenv("DYNAMODB_TABLE", "PhishyLogs")
table = None
try:
    dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
    candidate_table = dynamodb.Table(DYNAMO_TABLE_NAME)
    candidate_table.load()  # Validate table/credentials at startup
    table = candidate_table
except Exception as e:
    print(f"DynamoDB unavailable ({DYNAMO_TABLE_NAME}): {e}")


class MessageInput(BaseModel):
    message: str
    userId: str
    lat: float = Field(default=0.0)
    lon: float = Field(default=0.0)


def log_to_dynamo(message, confidence, scam_type, reason, user_id, lat, lon):
    if table is None:
        return

    rounded_lat = round(float(lat), 1)
    rounded_lon = round(float(lon), 1)

    try:
        table.put_item(
            Item={
                "id": str(uuid.uuid4()),
                "userId": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "message": message,
                "confidence": confidence,
                "type": scam_type,
                "reason": reason,
                "lat": Decimal(str(rounded_lat)),
                "lon": Decimal(str(rounded_lon)),
            }
        )
    except Exception as e:
        print("DynamoDB log error:", str(e))


@app.get("/history/{user_id}")
def get_user_history(user_id: str):
    if table is None:
        return {"items": []}

    try:
        response = table.scan()
        items = response.get("Items", [])
        user_items = [item for item in items if item.get("userId") == user_id]
        sorted_items = sorted(user_items, key=lambda x: x.get("timestamp", ""), reverse=True)
        return {"items": sorted_items}
    except Exception as e:
        print("Error in history fetch:", str(e))
        return {"items": []}


@app.get("/feed")
def get_public_feed():
    if table is None:
        return {"feed": []}

    try:
        response = table.scan()
        all_items = response.get("Items", [])
        sorted_items = sorted(all_items, key=lambda x: x.get("timestamp", ""), reverse=True)

        feed = [
            {
                "id": item.get("id", str(uuid.uuid4())),
                "timestamp": item.get("timestamp", ""),
                "message": item.get("message", ""),
                "type": item.get("type", "Unknown"),
                "confidence": item.get("confidence", "Unknown"),
                "lat": item.get("lat", 0.0),
                "lon": item.get("lon", 0.0),
            }
            for item in sorted_items[:20]
        ]

        return {"feed": feed}
    except Exception as e:
        print("Error in feed fetch:", str(e))
        return {"feed": []}


@app.get("/heatmap")
def get_heatmap_data():
    if table is None:
        return {"feed": []}

    try:
        response = table.scan()
        all_items = response.get("Items", [])

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
                "intensity": round((count / max_count) * 1.0, 2),
            }
            for (lat, lon), count in freq_map.items()
        ]

        return {"feed": heat_feed}
    except Exception as e:
        print("Error in heatmap fetch:", str(e))
        return {"feed": []}


@app.post("/analyze")
def analyze_message(data: MessageInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Server missing GOOGLE_API_KEY configuration.")

    try:
        prompt = generate_prompt(data.message)
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        lines = result_text.splitlines()

        confidence = next((line for line in lines if "Confidence:" in line), "Confidence: Unknown")
        scam_type = next((line for line in lines if "Type of scam" in line), "Type of scam: Unknown")
        reason = next((line for line in lines if "Reasoning" in line), "Reasoning: Not provided")
        verdict = next(
            (line for line in lines if "Yes it is a scam" in line or "No it is not a scam" in line),
            "Scam verdict: Unknown",
        )

        confidence_val = confidence.replace("Confidence:", "").strip()
        scam_type_val = scam_type.replace("Type of scam:", "").strip()
        reason_val = reason.replace("Reasoning behind your decision:", "").strip()

        log_to_dynamo(
            data.message,
            confidence_val,
            scam_type_val,
            reason_val,
            data.userId,
            data.lat,
            data.lon,
        )

        return {
            "confidence": confidence_val,
            "type": scam_type_val,
            "reason": reason_val,
            "verdict": verdict.strip(),
        }
    except Exception as e:
        print("Error analyzing message:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
