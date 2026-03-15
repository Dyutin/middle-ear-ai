from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os
import io
import torch
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms
from contextlib import asynccontextmanager

sys.path.append(os.path.join(os.getcwd(), "Transformer-Explainability"))
from baselines.ViT.ViT_LRP import vit_small_patch16_224 as vit_LRP


DEVICE = torch.device("cpu") # Cloud Run default
MODEL_PATH = "best_model.pth"
CLASSES = ['Earwax', 'Normal', 'Otitis Externa', 'Otitis Media', 'Object']

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


app = FastAPI()

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
