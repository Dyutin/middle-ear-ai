import sys
import os
import io
import torch
from PIL import Image
from torchvision import transforms
from contextlib import asynccontextmanager
import runpod
import base64
import numpy as np
import cv2

sys.path.append(os.path.join(os.getcwd(), "Transformer-Explainability"))
from baselines.ViT.ViT_LRP import vit_small_patch16_224 as vit_LRP
from baselines.ViT.ViT_explanation_generator import LRP

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "best_model.pth"
CLASSES = ['AcuteOtitisMedia', 'ChronicOtitisMedia', 'EarwaxImpaction', 'Normal', 'Tympanosclerosis']

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

class LRP_Compatible_ViT(torch.nn.Module):
    def __init__(self, num_classes):
        super(LRP_Compatible_ViT, self).__init__()
        self.vit = vit_LRP(pretrained=False, num_classes=num_classes)
    def forward(self, x):
        return self.vit(x)

print("Initializing Model on GPU...")
model = LRP_Compatible_ViT(num_classes=len(CLASSES)).to(DEVICE)
if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    new_state_dict = {k.replace("vit.", "").replace("module.", ""): v for k, v in checkpoint.items()}
    model.vit.load_state_dict(new_state_dict, strict=False)
    model.eval()
    print('Model Loaded')
    attribution_generator = LRP(model.vit)
    print('LRP generator loaded')
else:
    print(f"Error: Model file not found at {MODEL_PATH}")
    attribution_generator = None


def show_cam_on_image(img, mask):
    heatmap = cv2.applyColorMap(np.uint8(255 * mask), cv2.COLORMAP_JET)
    heatmap = np.float32(heatmap) / 255
    cam = heatmap + np.float32(img)
    cam = cam / np.max(cam)
    return (255 * cam).astype(np.uint8)

def encode_image_base64(img_array):
    img_pil = Image.fromarray(img_array)
    buff = io.BytesIO()
    img_pil.save(buff, format="PNG")
    return base64.b64encode(buff.getvalue()).decode("utf-8")

def handler(job):
    try:
        job_input = job['input']
        image_base64 = job_input.get("image")
        if not image_base64:
            return {"error": "No image data provided"}
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        original_cv = np.array(image.resize((224, 224)))
        img_tensor = transform(image).unsqueeze(0).to(DEVICE)

        img_tensor.requires_grad_()


        output = model(img_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, pred_idx = torch.max(probabilities, 0)

        attribution = attribution_generator.generate_LRP(
            img_tensor, method="transformer_attribution", index=pred_idx.item()
        ).detach()

        attribution = attribution.reshape(1, 1, 14, 14)
        attribution = torch.nn.functional.interpolate(attribution, scale_factor=16, mode="bilinear")
        attribution = attribution.reshape(224, 224).cpu().numpy()
        attribution = (attribution - attribution.min()) / (attribution.max() - attribution.min() + 1e-8)

        original_float = np.float32(original_cv) / 255

        heatmap_overlay = show_cam_on_image(original_float, attribution)
        heatmap_rgb = cv2.cvtColor(heatmap_overlay, cv2.COLOR_BGR2RGB)

        heatmap_uint8 = np.uint8(255 * attribution)
        threshold_value = np.percentile(heatmap_uint8, 85)
        _, thresh = cv2.threshold(heatmap_uint8, threshold_value, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour_img = original_cv.copy()
        cv2.drawContours(contour_img, contours, -1, (0, 255, 0), 2)

        return {
            "prediction": CLASSES[pred_idx.item()],
            "confidence": f"{confidence.item() * 100:.2f}%",
            "original_image": encode_image_base64(original_cv.astype(np.uint8)),
            "heatmap_image": encode_image_base64(heatmap_rgb.astype(np.uint8)),
            "contour_image": encode_image_base64(contour_img.astype(np.uint8))
        }
    except Exception as e:
        return {"error": str(e)}
    
runpod.serverless.start({"handler": handler})