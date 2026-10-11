import io
import csv
from datetime import datetime
from database import get_db

def calculate_variance_and_status(predicted_count, recorded_count):
    """
    Computes variance and inventory status according to reconciliation rules:
    variance = predicted_count - recorded_count
    MATCH: variance == 0
    UNDERSTOCKED: predicted_count < recorded_count
    OVERSTOCKED: predicted_count > recorded_count
    """
    variance = int(predicted_count) - int(recorded_count)
    if variance == 0:
        status = "MATCH"
    elif variance < 0:
        status = "UNDERSTOCKED"
    else:
        status = "OVERSTOCKED"
    return variance, status

def get_all_bins(search=None, status_filter=None, category_filter=None):
    """Retrieves all bins augmented with their latest reconciliation record."""
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        b.id,
        b.bin_id,
        b.warehouse_location,
        b.category,
        b.recorded_count,
        b.created_at,
        b.updated_at,
        r.predicted_count,
        r.variance,
        r.status,
        r.confidence,
        r.prediction_mode,
        r.image_path,
        r.created_at as last_reconciled_at
    FROM InventoryBins b
    LEFT JOIN (
        SELECT r1.*
        FROM ReconciliationRecords r1
        INNER JOIN (
            SELECT bin_id, MAX(id) as max_id
            FROM ReconciliationRecords
            GROUP BY bin_id
        ) r2 ON r1.id = r2.max_id
    ) r ON b.bin_id = r.bin_id
    WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (b.bin_id LIKE ? OR b.warehouse_location LIKE ? OR b.category LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    if category_filter and category_filter != "ALL":
        query += " AND b.category = ?"
        params.append(category_filter)
        
    if status_filter and status_filter != "ALL":
        if status_filter == "UNRECONCILED":
            query += " AND r.status IS NULL"
        else:
            query += " AND r.status = ?"
            params.append(status_filter)
            
    query += " ORDER BY b.id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    bins = []
    for row in rows:
        bins.append({
            "id": row["id"],
            "bin_id": row["bin_id"],
            "warehouse_location": row["warehouse_location"],
            "category": row["category"],
            "recorded_count": row["recorded_count"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "predicted_count": row["predicted_count"],
            "variance": row["variance"],
            "status": row["status"] if row["status"] else "UNRECONCILED",
            "confidence": row["confidence"],
            "prediction_mode": row["prediction_mode"],
            "image_path": row["image_path"],
            "last_reconciled_at": row["last_reconciled_at"],
        })
    return bins

def get_bin_by_id(bin_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM InventoryBins WHERE bin_id = ? OR id = ?", (bin_id, bin_id))
    bin_row = cursor.fetchone()
    
    if not bin_row:
        conn.close()
        return None
        
    actual_bin_id = bin_row["bin_id"]
    cursor.execute("""
        SELECT * FROM ReconciliationRecords 
        WHERE bin_id = ? 
        ORDER BY id DESC
    """, (actual_bin_id,))
    history_rows = cursor.fetchall()
    conn.close()
    
    return {
        "bin": dict(bin_row),
        "history": [dict(r) for r in history_rows]
    }

def create_bin(bin_id, warehouse_location, category, recorded_count):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO InventoryBins (bin_id, warehouse_location, category, recorded_count)
            VALUES (?, ?, ?, ?)
        """, (bin_id.strip().upper(), warehouse_location.strip(), category.strip(), int(recorded_count)))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"id": new_id, "bin_id": bin_id.strip().upper()}, None
    except sqlite3.IntegrityError:
        conn.close()
        return None, f"Bin with ID '{bin_id}' already exists."
    except Exception as e:
        conn.close()
        return None, str(e)

def update_bin(bin_id, warehouse_location, category, recorded_count):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE InventoryBins 
        SET warehouse_location = ?, category = ?, recorded_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE bin_id = ? OR id = ?
    """, (warehouse_location, category, int(recorded_count), bin_id, bin_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def delete_bin(bin_id):
    conn = get_db()
    cursor = conn.cursor()
    # Find actual bin_id first
    cursor.execute("SELECT bin_id FROM InventoryBins WHERE bin_id = ? OR id = ?", (bin_id, bin_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    actual_id = row["bin_id"]
    cursor.execute("DELETE FROM ReconciliationRecords WHERE bin_id = ?", (actual_id,))
    cursor.execute("DELETE FROM InventoryBins WHERE bin_id = ?", (actual_id,))
    conn.commit()
    conn.close()
    return True

def record_reconciliation(bin_id, image_path, recorded_count, predicted_count, confidence, prediction_mode, notes=None):
    variance, status = calculate_variance_and_status(predicted_count, recorded_count)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ReconciliationRecords 
        (bin_id, image_path, recorded_count, predicted_count, variance, status, confidence, prediction_mode, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (bin_id, image_path, int(recorded_count), int(predicted_count), variance, status, confidence, prediction_mode, notes))
    record_id = cursor.lastrowid
    
    # Update timestamp of the bin
    cursor.execute("UPDATE InventoryBins SET updated_at = CURRENT_TIMESTAMP WHERE bin_id = ?", (bin_id,))
    conn.commit()
    conn.close()
    
    return {
        "id": record_id,
        "bin_id": bin_id,
        "image_path": image_path,
        "recorded_count": int(recorded_count),
        "predicted_count": int(predicted_count),
        "variance": variance,
        "status": status,
        "confidence": confidence,
        "prediction_mode": prediction_mode,
        "notes": notes,
        "timestamp": datetime.now().isoformat()
    }

def get_reconciliation_history(search=None, status_filter=None, limit=20, offset=0):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
    SELECT r.*, b.category, b.warehouse_location
    FROM ReconciliationRecords r
    LEFT JOIN InventoryBins b ON r.bin_id = b.bin_id
    WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (r.bin_id LIKE ? OR b.category LIKE ? OR b.warehouse_location LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    if status_filter and status_filter != "ALL":
        query += " AND r.status = ?"
        params.append(status_filter)
        
    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]
    
    query += " ORDER BY r.id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "total": total_count,
        "records": [dict(r) for r in rows]
    }

def get_dashboard_stats():
    """Aggregates real-time statistics for the management dashboard."""
    bins = get_all_bins()
    
    total_bins = len(bins)
    total_recorded_products = sum(b["recorded_count"] for b in bins)
    
    reconciled_bins = [b for b in bins if b["status"] != "UNRECONCILED"]
    reconciled_count = len(reconciled_bins)
    
    matches = sum(1 for b in reconciled_bins if b["status"] == "MATCH")
    understocked = sum(1 for b in reconciled_bins if b["status"] == "UNDERSTOCKED")
    overstocked = sum(1 for b in reconciled_bins if b["status"] == "OVERSTOCKED")
    unreconciled = total_bins - reconciled_count
    mismatches = understocked + overstocked
    
    total_predicted_products = sum(
        b["predicted_count"] for b in reconciled_bins if b["predicted_count"] is not None
    )
    
    accuracy_percentage = round((matches / reconciled_count * 100), 1) if reconciled_count > 0 else 0.0
    
    # Category summary for comparison chart
    category_summary = {}
    for b in bins:
        cat = b["category"]
        if cat not in category_summary:
            category_summary[cat] = {"category": cat, "recorded": 0, "predicted": 0, "count": 0}
        category_summary[cat]["recorded"] += b["recorded_count"]
        if b["predicted_count"] is not None:
            category_summary[cat]["predicted"] += b["predicted_count"]
        category_summary[cat]["count"] += 1
        
    # Recent activity
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.*, b.category, b.warehouse_location
        FROM ReconciliationRecords r
        LEFT JOIN InventoryBins b ON r.bin_id = b.bin_id
        ORDER BY r.id DESC LIMIT 6
    """)
    recent = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return {
        "total_bins": total_bins,
        "total_recorded_products": total_recorded_products,
        "total_predicted_products": total_predicted_products,
        "reconciled_bins_count": matches,
        "mismatched_bins_count": mismatches,
        "accuracy_percentage": accuracy_percentage,
        "status_distribution": {
            "MATCH": matches,
            "UNDERSTOCKED": understocked,
            "OVERSTOCKED": overstocked,
            "UNRECONCILED": unreconciled
        },
        "category_comparison": list(category_summary.values()),
        "recent_activities": recent
    }

def get_analytics_data():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM ReconciliationRecords ORDER BY id ASC")
    records = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    total_scans = len(records)
    if total_scans == 0:
        return {
            "total_scans": 0,
            "match_rate": 0,
            "overstocked_count": 0,
            "understocked_count": 0,
            "timeline": [],
            "variance_distribution": []
        }
        
    match_count = sum(1 for r in records if r["status"] == "MATCH")
    overstocked_count = sum(1 for r in records if r["status"] == "OVERSTOCKED")
    understocked_count = sum(1 for r in records if r["status"] == "UNDERSTOCKED")
    match_rate = round((match_count / total_scans) * 100, 1)
    
    # Variance distribution
    var_map = {}
    for r in records:
        v = r["variance"]
        label = f"{'+' if v > 0 else ''}{v}"
        var_map[label] = var_map.get(label, 0) + 1
        
    variance_dist = [{"variance": k, "count": v} for k, v in sorted(var_map.items(), key=lambda x: int(x[0]))]
    
    # Timeline
    timeline_map = {}
    for r in records:
        dt = r["created_at"][:10] if r["created_at"] else "Today"
        if dt not in timeline_map:
            timeline_map[dt] = {"date": dt, "scans": 0, "matches": 0, "mismatches": 0}
        timeline_map[dt]["scans"] += 1
        if r["status"] == "MATCH":
            timeline_map[dt]["matches"] += 1
        else:
            timeline_map[dt]["mismatches"] += 1
            
    return {
        "total_scans": total_scans,
        "match_count": match_count,
        "mismatch_count": total_scans - match_count,
        "match_rate": match_rate,
        "overstocked_count": overstocked_count,
        "understocked_count": understocked_count,
        "variance_distribution": variance_dist,
        "timeline": list(timeline_map.values())
    }

def export_reconciliations_csv():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            r.id,
            r.bin_id,
            b.category,
            b.warehouse_location,
            r.recorded_count,
            r.predicted_count,
            r.variance,
            r.status,
            r.confidence,
            r.prediction_mode,
            r.created_at
        FROM ReconciliationRecords r
        LEFT JOIN InventoryBins b ON r.bin_id = b.bin_id
        ORDER BY r.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Bin ID", "Category", "Warehouse Location",
        "Recorded Count", "Predicted Count", "Variance", "Reconciliation Status",
        "Model Confidence", "Prediction Mode", "Reconciled At"
    ])
    
    for row in rows:
        conf_str = f"{row['confidence']:.2%}" if row['confidence'] is not None else "N/A"
        writer.writerow([
            row["id"], row["bin_id"], row["category"] or "N/A", row["warehouse_location"] or "N/A",
            row["recorded_count"], row["predicted_count"], row["variance"], row["status"],
            conf_str, row["prediction_mode"], row["created_at"]
        ])
        
    return output.getvalue()
