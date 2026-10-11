"""
Training Pipeline for Amazon Inventory Bin Item Counting (0-5 Classes)
Trains ResNet18/ResNet34 with Transfer Learning and evaluates on validation split.
"""
import os
import argparse
import json
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

from model import build_inventory_model
from dataset import AmazonBinDataset, get_transforms, create_synthetic_bin_dataset

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def load_data_samples(data_dir):
    """Gathers all image paths and labels from class subfolders count_0 .. count_5"""
    samples = []
    if not os.path.exists(data_dir):
        return samples
        
    for count in range(6):
        c_dir = os.path.join(data_dir, f"count_{count}")
        if os.path.isdir(c_dir):
            for fname in os.listdir(c_dir):
                if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                    samples.append((os.path.join(c_dir, fname), count))
    return samples

def train_model(model_name="resnet18", epochs=5, batch_size=16, lr=0.001, data_dir=None, save_dir=None):
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training on device: {device}")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if data_dir is None:
        data_dir = os.path.join(base_dir, "data")
    if save_dir is None:
        save_dir = os.path.join(base_dir, "checkpoints")
        
    os.makedirs(save_dir, exist_ok=True)
    
    samples = load_data_samples(data_dir)
    if len(samples) == 0:
        print("[!] No images found in data directory. Generating synthetic benchmark dataset...")
        samples = create_synthetic_bin_dataset(data_dir, samples_per_class=40)
        
    print(f"[*] Total dataset samples: {len(samples)}")
    
    # Shuffle and split into 70% Train, 20% Val, 10% Test (Matching Stanford Paper)
    random.shuffle(samples)
    n_total = len(samples)
    n_train = int(0.70 * n_total)
    n_val = int(0.20 * n_total)
    
    train_samples = samples[:n_train]
    val_samples = samples[n_train:n_train + n_val]
    test_samples = samples[n_train + n_val:]
    
    print(f"[*] Split sizes - Train: {len(train_samples)}, Val: {len(val_samples)}, Test: {len(test_samples)}")
    
    # Save test set sample list for evaluate.py
    with open(os.path.join(save_dir, "test_samples.json"), "w") as f:
        json.dump(test_samples, f)
        
    train_transform, val_transform = get_transforms()
    
    train_dataset = AmazonBinDataset(train_samples, transform=train_transform)
    val_dataset = AmazonBinDataset(val_samples, transform=val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    # Build Model
    model = build_inventory_model(model_name=model_name, num_classes=6, pretrained=False)
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    
    best_val_acc = 0.0
    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "val_mae": []
    }
    
    best_model_path = os.path.join(save_dir, "best_model.pth")
    
    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0
        
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels.data).item()
            total_train += labels.size(0)
            
        epoch_train_loss = running_loss / total_train
        epoch_train_acc = (correct_train / total_train) * 100.0
        
        # Validation Phase
        model.eval()
        val_running_loss = 0.0
        correct_val = 0
        total_val = 0
        abs_errors = []
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_running_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels.data).item()
                total_val += labels.size(0)
                
                abs_errors.extend(torch.abs(preds - labels).cpu().numpy().tolist())
                
        epoch_val_loss = val_running_loss / total_val if total_val > 0 else 0
        epoch_val_acc = (correct_val / total_val) * 100.0 if total_val > 0 else 0
        epoch_val_mae = float(np.mean(abs_errors)) if len(abs_errors) > 0 else 0.0
        
        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 2))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 2))
        history["val_mae"].append(round(epoch_val_mae, 4))
        
        print(f"Epoch [{epoch}/{epochs}] "
              f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.1f}% | "
              f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.1f}% | Val MAE: {epoch_val_mae:.2f}")
              
        if epoch_val_acc >= best_val_acc or epoch == 1:
            best_val_acc = epoch_val_acc
            torch.save({
                "model_state_dict": model.state_dict(),
                "model_name": model_name,
                "num_classes": 6,
                "best_val_acc": best_val_acc,
                "epoch": epoch
            }, best_model_path)
            print(f"  --> Saved new best checkpoint to {best_model_path} (Val Acc: {best_val_acc:.1f}%)")
            
    # Save training history and summary
    summary_path = os.path.join(save_dir, "training_history.json")
    with open(summary_path, "w") as f:
        json.dump({
            "model_name": model_name,
            "epochs": epochs,
            "batch_size": batch_size,
            "best_val_acc": best_val_acc,
            "history": history
        }, f, indent=2)
        
    print(f"[OK] Training completed successfully! Best validation accuracy: {best_val_acc:.1f}%")
    return best_model_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Inventory Bin Classifier")
    parser.add_argument("--model", type=str, default="resnet18", choices=["resnet18", "resnet34"])
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--data_dir", type=str, default=None)
    parser.add_argument("--save_dir", type=str, default=None)
    args = parser.parse_args()
    
    train_model(args.model, args.epochs, args.batch_size, args.lr, args.data_dir, args.save_dir)
