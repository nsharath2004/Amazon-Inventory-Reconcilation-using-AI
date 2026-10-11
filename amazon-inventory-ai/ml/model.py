"""
ResNet Architecture for Amazon Bin Inventory Counting (Classes 0-5)
Inspired by: "Amazon Inventory Reconciliation Using AI" (Stanford University / ABID Challenge)
"""
import torch
import torch.nn as nn
from torchvision import models

def build_inventory_model(model_name="resnet18", num_classes=6, pretrained=False):
    """
    Builds a ResNet model for counting products in bins (0 to 5 items).
    Supports resnet18 and resnet34.
    """
    if model_name.lower() == "resnet34":
        weights = models.ResNet34_Weights.DEFAULT if pretrained else None
        model = models.resnet34(weights=weights)
    else:
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        model = models.resnet18(weights=weights)
    
    # Replace final fully connected layer for 6 classes (0, 1, 2, 3, 4, 5 products)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model

if __name__ == "__main__":
    m = build_inventory_model("resnet18", num_classes=6)
    dummy_input = torch.randn(2, 3, 224, 224)
    out = m(dummy_input)
    print("Model test output shape:", out.shape)
    print("Classes count:", out.shape[1])
