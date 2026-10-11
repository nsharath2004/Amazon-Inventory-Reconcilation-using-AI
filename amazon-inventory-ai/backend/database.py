import sqlite3
import os
import shutil
from datetime import datetime, timedelta
import random
from config import DATABASE_PATH, UPLOAD_FOLDER, SAMPLE_FOLDER

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. InventoryBins Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS InventoryBins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bin_id TEXT UNIQUE NOT NULL,
        warehouse_location TEXT NOT NULL,
        category TEXT NOT NULL,
        recorded_count INTEGER NOT NULL CHECK (recorded_count >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. ReconciliationRecords Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ReconciliationRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bin_id TEXT NOT NULL,
        image_path TEXT NOT NULL,
        recorded_count INTEGER NOT NULL,
        predicted_count INTEGER NOT NULL,
        variance INTEGER NOT NULL,
        status TEXT NOT NULL,
        confidence REAL,
        prediction_mode TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bin_id) REFERENCES InventoryBins(bin_id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()

def seed_initial_data(force=False):
    """Seeds realistic inventory bins and past reconciliation records."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM InventoryBins;")
    count = cursor.fetchone()[0]
    
    if count > 0 and not force:
        conn.close()
        return False

    if force:
        cursor.execute("DELETE FROM ReconciliationRecords;")
        cursor.execute("DELETE FROM InventoryBins;")
        conn.commit()

    sample_bins = [
        ("BIN-101", "Aisle 01, Bay A, Tier 1 - BLR-FC1", "Electronics", 3),
        ("BIN-102", "Aisle 01, Bay A, Tier 2 - BLR-FC1", "Electronics", 2),
        ("BIN-103", "Aisle 02, Bay B, Tier 1 - BLR-FC1", "Books & Media", 4),
        ("BIN-104", "Aisle 02, Bay B, Tier 3 - BLR-FC1", "Books & Media", 1),
        ("BIN-105", "Aisle 03, Bay C, Tier 1 - BLR-FC1", "Home & Kitchen", 5),
        ("BIN-106", "Aisle 03, Bay C, Tier 2 - BLR-FC1", "Home & Kitchen", 0),
        ("BIN-107", "Aisle 04, Bay D, Tier 1 - BLR-FC1", "Apparel & Shoes", 2),
        ("BIN-108", "Aisle 04, Bay D, Tier 2 - BLR-FC1", "Apparel & Shoes", 3),
        ("BIN-109", "Aisle 05, Bay E, Tier 1 - BLR-FC1", "Toys & Games", 4),
        ("BIN-110", "Aisle 05, Bay E, Tier 2 - BLR-FC1", "Toys & Games", 2),
        ("BIN-111", "Aisle 06, Bay F, Tier 1 - BLR-FC1", "Office Supplies", 1),
        ("BIN-112", "Aisle 06, Bay F, Tier 3 - BLR-FC1", "Health & Personal Care", 3),
    ]

    for b in sample_bins:
        cursor.execute("""
            INSERT INTO InventoryBins (bin_id, warehouse_location, category, recorded_count)
            VALUES (?, ?, ?, ?);
        """, b)
    
    conn.commit()

    # Seed sample reconciliation records
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Ensure sample images are copied to uploads
    history_templates = [
        ("BIN-101", 3, 3, 0, "MATCH", 0.94, "AI_MODEL", "sample_bin_3_items.jpg"),
        ("BIN-102", 2, 3, 1, "OVERSTOCKED", 0.89, "AI_MODEL", "sample_bin_3_items.jpg"),
        ("BIN-103", 4, 3, -1, "UNDERSTOCKED", 0.91, "AI_MODEL", "sample_bin_3_items.jpg"),
        ("BIN-104", 1, 1, 0, "MATCH", 0.96, "AI_MODEL", "sample_bin_1_items.jpg"),
        ("BIN-105", 5, 4, -1, "UNDERSTOCKED", 0.85, "AI_MODEL", "sample_bin_4_items.jpg"),
        ("BIN-106", 0, 0, 0, "MATCH", 0.99, "AI_MODEL", "sample_bin_0_items.jpg"),
        ("BIN-107", 2, 2, 0, "MATCH", None, "DEMO_MODE", "sample_bin_2_items.jpg"),
        ("BIN-108", 3, 4, 1, "OVERSTOCKED", 0.88, "AI_MODEL", "sample_bin_4_items.jpg"),
        ("BIN-109", 4, 4, 0, "MATCH", 0.93, "AI_MODEL", "sample_bin_4_items.jpg"),
        ("BIN-110", 2, 1, -1, "UNDERSTOCKED", None, "DEMO_MODE", "sample_bin_1_items.jpg"),
    ]

    now = datetime.now()
    for idx, (bin_id, rec, pred, var, status, conf, mode, sample_file) in enumerate(history_templates):
        # copy file if exists
        src = os.path.join(SAMPLE_FOLDER, sample_file)
        dest_filename = f"seed_{bin_id}_{sample_file}"
        dest_path = os.path.join(UPLOAD_FOLDER, dest_filename)
        if os.path.exists(src):
            shutil.copyfile(src, dest_path)
            rel_image_path = f"/uploads/{dest_filename}"
        else:
            rel_image_path = "/uploads/placeholder.jpg"

        record_time = (now - timedelta(hours=(len(history_templates) - idx) * 3, minutes=random.randint(5, 50))).strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            INSERT INTO ReconciliationRecords 
            (bin_id, image_path, recorded_count, predicted_count, variance, status, confidence, prediction_mode, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (bin_id, rel_image_path, rec, pred, var, status, conf, mode, f"Initial automated scan for {bin_id}", record_time))

    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
    seed_initial_data(force=True)
    print("Database initialized and seeded successfully!")
