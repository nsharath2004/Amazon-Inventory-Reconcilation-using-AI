"""
Dataset and Data Transformation module for Amazon Bin Image Dataset.
Provides dataset loader, data augmentation transforms, and a realistic
synthetic warehouse bin generator for immediate training and testing.
"""
import os
import random
import numpy as np
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image, ImageDraw, ImageFont

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def get_transforms():
    """Returns train and evaluation transforms matching the Stanford paper."""
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])
    
    return train_transform, val_transform

class AmazonBinDataset(Dataset):
    """
    Custom PyTorch Dataset for Bin Images.
    Supports either:
    1. Folder structure: data_dir/<class_id>/*.jpg
    2. List of (image_path, label) tuples
    """
    def __init__(self, samples, transform=None):
        self.samples = samples  # list of (path, label)
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            image = Image.open(path).convert('RGB')
        except Exception:
            # Fallback black image if corrupt
            image = Image.new('RGB', (224, 224), color=(0, 0, 0))
            
        if self.transform:
            image = self.transform(image)
            
        return image, torch.tensor(label, dtype=torch.long)

def generate_bin_image(num_items, image_size=(224, 224)):
    """
    Generates a realistic synthetic warehouse bin image.
    Simulates Amazon Kiva robot yellow pod bin with products inside:
    - Pod background: dark/fabric textured shelf
    - Shelf frame: yellow pod edge / strap
    - Products: items of different shapes, colors, and packagings
    """
    w, h = image_size
    img = Image.new('RGB', (w, h), color=(38, 42, 50))
    draw = ImageDraw.Draw(img)
    
    # Draw pod shelf back wall & shadow
    for y in range(0, h, 8):
        shade = 35 + (y % 15)
        draw.line([(0, y), (w, y)], fill=(shade, shade + 5, shade + 10))
        
    # Draw shelf floor
    draw.polygon([(0, int(h * 0.75)), (w, int(h * 0.75)), (w, h), (0, h)], fill=(48, 52, 60))
    
    # Draw yellow pod elastic strap / bin lip (distinctive Amazon Kiva pod feature)
    draw.rectangle([0, h - 18, w, h], fill=(235, 175, 20))
    draw.line([(0, h - 18), (w, h - 18)], fill=(180, 130, 10), width=2)
    draw.rectangle([0, 0, w, 14], fill=(235, 175, 20))

    # Palettes for realistic products (boxes, books, apparel packs, bottles)
    product_colors = [
        (190, 80, 50),   # Red package
        (45, 110, 180),  # Blue box
        (220, 190, 60),  # Yellow packaging
        (60, 160, 100),  # Green box
        (140, 80, 160),  # Purple bottle / item
        (230, 230, 240), # White box
        (160, 115, 75),  # Brown cardboard box
    ]
    
    # Place items inside bin
    if num_items > 0:
        # Predefined placement zones so items look placed inside
        zones = [
            (25, 45, 95, 140),
            (115, 40, 185, 135),
            (65, 80, 145, 170),
            (30, 95, 100, 180),
            (120, 95, 195, 180)
        ]
        random.shuffle(zones)
        selected_zones = zones[:min(num_items, len(zones))]
        
        for i in range(num_items):
            box_color = random.choice(product_colors)
            if i < len(selected_zones):
                x1, y1, x2, y2 = selected_zones[i]
                # Add jitter
                x1 = max(10, x1 + random.randint(-8, 8))
                y1 = max(20, y1 + random.randint(-8, 8))
                x2 = min(w - 10, x2 + random.randint(-8, 8))
                y2 = min(h - 22, y2 + random.randint(-8, 8))
            else:
                x1 = random.randint(20, 120)
                y1 = random.randint(30, 100)
                x2 = min(w - 15, x1 + random.randint(45, 80))
                y2 = min(h - 22, y1 + random.randint(45, 75))
                
            # Draw package body
            draw.rectangle([x1, y1, x2, y2], fill=box_color, outline=(20, 20, 20), width=2)
            
            # Draw tape or barcode label on package
            if random.random() > 0.3:
                lbl_w = (x2 - x1) // 3
                lbl_h = (y2 - y1) // 4
                lx = x1 + (x2 - x1) // 4
                ly = y1 + (y2 - y1) // 3
                draw.rectangle([lx, ly, lx + lbl_w, ly + lbl_h], fill=(245, 245, 245))
                # Barcode stripes
                for s in range(lx + 2, lx + lbl_w - 2, 4):
                    draw.line([(s, ly + 2), (s, ly + lbl_h - 2)], fill=(20, 20, 20), width=1)
                    
            # Draw package fold/3D highlight
            draw.line([(x1, y1), (x2, y1)], fill=(255, 255, 255, 80), width=1)

    return img

def create_synthetic_bin_dataset(output_dir, samples_per_class=40):
    """
    Creates a benchmark dataset of bin images across classes 0 to 5.
    Total samples = 6 classes * samples_per_class = 240 images.
    """
    os.makedirs(output_dir, exist_ok=True)
    all_samples = []
    
    for count in range(6):
        class_dir = os.path.join(output_dir, f"count_{count}")
        os.makedirs(class_dir, exist_ok=True)
        for i in range(samples_per_class):
            img = generate_bin_image(count)
            filename = f"bin_c{count}_{i:03d}.jpg"
            filepath = os.path.join(class_dir, filename)
            img.save(filepath, quality=95)
            all_samples.append((filepath, count))
            
    print(f"Created synthetic dataset at {output_dir} with {len(all_samples)} images.")
    return all_samples

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
