from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 1. Create the Receptionist
app = FastAPI()

# 2. The Security Pass (CORS)
# This allows your local React app to talk to this Google Cloud server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"status": "AI Server is Running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    return {
        "class": "Normal", 
        "confidence": 0.95
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
