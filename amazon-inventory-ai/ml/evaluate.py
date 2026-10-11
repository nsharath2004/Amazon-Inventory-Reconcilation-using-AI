"""
Model Evaluation Script for Amazon Inventory Count Classification.
Evaluates the trained model on test set and computes:
- Accuracy
- Confusion Matrix
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Precision, Recall, F1 per class
"""
import os
import json
import numpy as np
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, mean_squared_error, mean_absolute_error

from model import build_inventory_model
from dataset import AmazonBinDataset, get_transforms, load_data_samples

def evaluate(checkpoint_path=None, test_samples_path=None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if checkpoint_path is None:
        checkpoint_path = os.path.join(base_dir, "checkpoints", "best_model.pth")
    if test_samples_path is None:
        test_samples_path = os.path.join(base_dir, "checkpoints", "test_samples.json")
        
    if not os.path.exists(checkpoint_path):
        print(f"[!] Checkpoint not found at: {checkpoint_path}. Run train.py first.")
        return None
        
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Evaluating on device: {device}")
    
    # Load test samples
    if os.path.exists(test_samples_path):
        with open(test_samples_path, "r") as f:
            test_samples = json.load(f)
    else:
        # Fallback to loading from data dir
        print("[!] test_samples.json not found, reading from ml/data...")
        data_dir = os.path.join(base_dir, "data")
        all_samples = load_data_samples(data_dir)
        test_samples = all_samples[:max(10, int(len(all_samples) * 0.15))]
        
    if not test_samples:
        print("[!] No test samples found to evaluate.")
        return None
        
    print(f"[*] Total test samples: {len(test_samples)}")
    
    _, val_transform = get_transforms()
    test_dataset = AmazonBinDataset(test_samples, transform=val_transform)
    test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)
    
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model_name = checkpoint.get("model_name", "resnet18")
    model = build_inventory_model(model_name=model_name, num_classes=6, pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()
    
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.numpy().tolist())
            
    acc = accuracy_score(all_targets, all_preds) * 100.0
    mae = mean_absolute_error(all_targets, all_preds)
    rmse = np.sqrt(mean_squared_error(all_targets, all_preds))
    cm = confusion_matrix(all_targets, all_preds, labels=list(range(6)))
    report = classification_report(all_targets, all_preds, labels=list(range(6)), output_dict=True, zero_division=0)
    
    print("\n" + "="*50)
    print("AMAZON INVENTORY RECONCILIATION - MODEL EVALUATION")
    print("="*50)
    print(f"Test Accuracy:           {acc:.2f}%")
    print(f"Mean Absolute Error:     {mae:.3f} items")
    print(f"Root Mean Squared Error: {rmse:.3f} items")
    print("\nConfusion Matrix (Rows: Actual, Cols: Predicted [0..5]):")
    print(cm)
    print("="*50)
    
    report_data = {
        "model_name": model_name,
        "test_accuracy": round(acc, 2),
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "confusion_matrix": cm.tolist(),
        "classification_report": report
    }
    
    out_file = os.path.join(base_dir, "checkpoints", "evaluation_report.json")
    with open(out_file, "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"[OK] Evaluation report saved to: {out_file}\n")
    return report_data

if __name__ == "__main__":
    evaluate()
