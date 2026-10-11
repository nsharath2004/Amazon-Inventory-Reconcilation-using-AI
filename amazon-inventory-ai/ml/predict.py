"""
Prediction and Inference Pipeline for Amazon Bin Image Product Counting.
Uses PyTorch ResNet when trained weights exist.
Falls back to clearly labeled DEMO MODE when weights are absent or demo mode is selected.
"""
import os
import torch
import torch.nn.functional as F
from PIL import Image
import cv2
import numpy as np

from model import build_inventory_model
from dataset import get_transforms

class InventoryPredictor:
    def __init__(self, checkpoint_path=None, model_name="resnet18"):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        if checkpoint_path is None:
            self.checkpoint_path = os.path.join(self.base_dir, "checkpoints", "best_model.pth")
        else:
            self.checkpoint_path = checkpoint_path
            
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.model_loaded = False
        self.model_name = model_name
        self.best_val_acc = None
        _, self.transform = get_transforms()
        
        self._load_checkpoint_if_available()

    def _load_checkpoint_if_available(self):
        """Attempts to load trained weights from checkpoint."""
        if os.path.exists(self.checkpoint_path):
            try:
                checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
                saved_model_name = checkpoint.get("model_name", self.model_name)
                self.model = build_inventory_model(model_name=saved_model_name, num_classes=6, pretrained=False)
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model.to(self.device)
                self.model.eval()
                self.model_loaded = True
                self.best_val_acc = checkpoint.get("best_val_acc", None)
                print(f"[OK] Loaded trained model weights from: {self.checkpoint_path} (Val Acc: {self.best_val_acc}%)")
            except Exception as e:
                print(f"[!] Error loading checkpoint: {e}. Defaulting to Demo Mode.")
                self.model = None
                self.model_loaded = False
        else:
            self.model_loaded = False
            self.model = None

    def get_status(self):
        """Returns the current status of the ML inference engine."""
        return {
            "model_loaded": self.model_loaded,
            "checkpoint_path": self.checkpoint_path,
            "checkpoint_exists": os.path.exists(self.checkpoint_path),
            "device": str(self.device),
            "model_architecture": self.model_name if not self.model_loaded else "ResNet (Custom 6-Class)",
            "trained_accuracy": self.best_val_acc,
            "classes": [0, 1, 2, 3, 4, 5],
        }

    def predict(self, image_path, force_demo=False):
        """
        Predicts the product count (0-5) in the warehouse bin image.
        Returns:
            dict containing:
            - predicted_count: int (0 to 5)
            - confidence: float or None
            - prediction_mode: 'AI_MODEL' or 'DEMO_MODE'
            - class_probabilities: list of floats or None
            - details: str explanation
        """
        # Ensure fresh check in case a model was trained while server runs
        if not self.model_loaded and os.path.exists(self.checkpoint_path):
            self._load_checkpoint_if_available()

        if self.model_loaded and not force_demo:
            try:
                return self._predict_with_model(image_path)
            except Exception as e:
                print(f"[!] Inference error on image: {e}. Falling back to demo mode.")
                return self._predict_with_demo_heuristic(image_path, error_fallback=True)
        else:
            return self._predict_with_demo_heuristic(image_path)

    def _predict_with_model(self, image_path):
        """Actual PyTorch ResNet inference on user image."""
        img = Image.open(image_path).convert('RGB')
        tensor = self.transform(img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = F.softmax(outputs, dim=1).squeeze(0)
            pred_class = int(torch.argmax(probs).item())
            confidence = float(probs[pred_class].item())
            prob_list = [round(float(p), 4) for p in probs.cpu().numpy()]
            
        return {
            "predicted_count": pred_class,
            "confidence": round(confidence, 4),
            "prediction_mode": "AI_MODEL",
            "class_probabilities": prob_list,
            "details": f"Inference computed using fine-tuned ResNet classifier (Predicted Class: {pred_class}, Confidence: {confidence:.1%})."
        }

    def _predict_with_demo_heuristic(self, image_path, error_fallback=False):
        """
        Intelligent Demo Mode analysis using OpenCV computer vision heuristics
        (Laplacian variance & contour color segmentation inspired by Stanford paper feature analysis).
        Clearly designated as DEMO MODE.
        """
        try:
            cv_img = cv2.imread(image_path)
            if cv_img is None:
                raise ValueError("Could not read image with OpenCV")
                
            # Resize for consistent inspection
            resized = cv2.resize(cv_img, (224, 224))
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            
            # Shelf / pod crop: exclude bottom strap and top frame
            roi = gray[25:200, 15:210]
            
            # Edge detection & contours
            blur = cv2.GaussianBlur(roi, (5, 5), 0)
            edges = cv2.Canny(blur, 40, 120)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter contours by size
            valid_contours = [c for c in contours if cv2.contourArea(c) > 120]
            count_estimate = min(5, len(valid_contours))
            
            # Laplacian variance to check if bin is nearly empty (clean shelf)
            lap_var = cv2.Laplacian(roi, cv2.CV_64F).var()
            if lap_var < 80:
                count_estimate = 0
            elif count_estimate == 0:
                count_estimate = 1
                
        except Exception:
            # Fallback random count 1-3 if CV fails
            count_estimate = 2
            
        return {
            "predicted_count": count_estimate,
            "confidence": None,  # Explicitly None per prompt instruction not to fabricate confidence in demo mode
            "prediction_mode": "DEMO_MODE",
            "class_probabilities": None,
            "details": "DEMO MODE: Simulated prediction using computer vision heuristic (Contour/Laplacian variance). Train weights using `python ml/train.py` to enable full PyTorch inference."
        }

if __name__ == "__main__":
    predictor = InventoryPredictor()
    print("Engine status:", predictor.get_status())
