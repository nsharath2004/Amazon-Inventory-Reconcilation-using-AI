import os
import uuid
from flask import Blueprint, request, jsonify, Response, send_from_directory
from werkzeug.utils import secure_filename
import sys

# Ensure ml module is importable
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ML_DIR = os.path.join(PROJECT_ROOT, "ml")
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

from config import UPLOAD_FOLDER, SAMPLE_FOLDER, ALLOWED_EXTENSIONS
from database import get_db, seed_initial_data
import services.inventory_service as inv_service
from predict import InventoryPredictor

api_bp = Blueprint("api", __name__)

# Global predictor instance
predictor = InventoryPredictor()
# User configurable toggle: if True, all predictions run in DEMO MODE
GLOBAL_SETTINGS = {
    "force_demo_mode": False
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    try:
        stats = inv_service.get_dashboard_stats()
        model_status = predictor.get_status()
        return jsonify({
            "success": True,
            "data": stats,
            "system_mode": "DEMO_MODE" if GLOBAL_SETTINGS["force_demo_mode"] else ("AI_MODEL" if model_status["model_loaded"] else "DEMO_MODE"),
            "model_info": model_status
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route("/bins", methods=["GET"])
def list_bins():
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "ALL")
    category_filter = request.args.get("category", "ALL")
    
    bins = inv_service.get_all_bins(search=search, status_filter=status_filter, category_filter=category_filter)
    return jsonify({"success": True, "data": bins, "count": len(bins)})

@api_bp.route("/bins", methods=["POST"])
def add_bin():
    data = request.get_json() or {}
    bin_id = data.get("bin_id")
    warehouse_location = data.get("warehouse_location")
    category = data.get("category")
    recorded_count = data.get("recorded_count")
    
    if not bin_id or not warehouse_location or not category or recorded_count is None:
        return jsonify({"success": False, "error": "Missing required fields: bin_id, warehouse_location, category, recorded_count"}), 400
        
    try:
        recorded_count = int(recorded_count)
        if recorded_count < 0 or recorded_count > 50:
            return jsonify({"success": False, "error": "recorded_count must be between 0 and 50"}), 400
    except ValueError:
        return jsonify({"success": False, "error": "recorded_count must be an integer"}), 400
        
    result, err = inv_service.create_bin(bin_id, warehouse_location, category, recorded_count)
    if err:
        return jsonify({"success": False, "error": err}), 400
        
    return jsonify({"success": True, "data": result}), 201

@api_bp.route("/bins/<bin_id>", methods=["GET"])
def get_bin(bin_id):
    bin_data = inv_service.get_bin_by_id(bin_id)
    if not bin_data:
        return jsonify({"success": False, "error": f"Bin '{bin_id}' not found"}), 404
    return jsonify({"success": True, "data": bin_data})

@api_bp.route("/bins/<bin_id>", methods=["PUT"])
def update_bin(bin_id):
    data = request.get_json() or {}
    warehouse_location = data.get("warehouse_location")
    category = data.get("category")
    recorded_count = data.get("recorded_count")
    
    if not warehouse_location or not category or recorded_count is None:
        return jsonify({"success": False, "error": "Missing required fields"}), 400
        
    try:
        recorded_count = int(recorded_count)
    except ValueError:
        return jsonify({"success": False, "error": "recorded_count must be an integer"}), 400
        
    ok = inv_service.update_bin(bin_id, warehouse_location, category, recorded_count)
    if not ok:
        return jsonify({"success": False, "error": "Bin not found or not modified"}), 404
        
    return jsonify({"success": True, "message": "Bin updated successfully"})

@api_bp.route("/bins/<bin_id>", methods=["DELETE"])
def delete_bin(bin_id):
    ok = inv_service.delete_bin(bin_id)
    if not ok:
        return jsonify({"success": False, "error": "Bin not found"}), 404
    return jsonify({"success": True, "message": f"Bin '{bin_id}' deleted successfully"})

@api_bp.route("/analyze", methods=["POST"])
def analyze_image():
    bin_id = request.form.get("bin_id")
    sample_name = request.form.get("sample_name")
    force_demo_req = request.form.get("force_demo")
    
    if not bin_id:
        return jsonify({"success": False, "error": "Please select a target bin_id"}), 400
        
    bin_record = inv_service.get_bin_by_id(bin_id)
    if not bin_record:
        return jsonify({"success": False, "error": f"Bin '{bin_id}' does not exist"}), 404
        
    recorded_count = bin_record["bin"]["recorded_count"]
    
    saved_filename = None
    save_path = None
    
    # Check if a custom file was uploaded
    if 'image' in request.files and request.files['image'].filename != '':
        file = request.files['image']
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "Invalid file type. Allowed: jpg, jpeg, png"}), 400
            
        ext = file.filename.rsplit('.', 1)[1].lower()
        saved_filename = f"{uuid.uuid4().hex[:12]}_{secure_filename(file.filename)}"
        save_path = os.path.join(UPLOAD_FOLDER, saved_filename)
        file.save(save_path)
    elif sample_name:
        # Use existing sample image
        sample_path = os.path.join(SAMPLE_FOLDER, sample_name)
        if not os.path.exists(sample_path):
            return jsonify({"success": False, "error": f"Sample image '{sample_name}' not found"}), 404
        saved_filename = f"copy_{uuid.uuid4().hex[:8]}_{sample_name}"
        save_path = os.path.join(UPLOAD_FOLDER, saved_filename)
        import shutil
        shutil.copyfile(sample_path, save_path)
    else:
        return jsonify({"success": False, "error": "Please provide an image file or sample image name"}), 400

    effective_force_demo = GLOBAL_SETTINGS["force_demo_mode"] or (force_demo_req and force_demo_req.lower() in ("true", "1"))
    
    # Run Inference
    prediction_result = predictor.predict(save_path, force_demo=effective_force_demo)
    
    predicted_count = prediction_result["predicted_count"]
    confidence = prediction_result["confidence"]
    prediction_mode = prediction_result["prediction_mode"]
    
    web_image_path = f"/uploads/{saved_filename}"
    
    reconciliation = inv_service.record_reconciliation(
        bin_id=bin_record["bin"]["bin_id"],
        image_path=web_image_path,
        recorded_count=recorded_count,
        predicted_count=predicted_count,
        confidence=confidence,
        prediction_mode=prediction_mode,
        notes=prediction_result.get("details", "")
    )
    
    return jsonify({
        "success": True,
        "data": {
            "reconciliation": reconciliation,
            "prediction": prediction_result,
            "bin": bin_record["bin"]
        }
    })

@api_bp.route("/history", methods=["GET"])
def get_history():
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "ALL")
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))
    
    result = inv_service.get_reconciliation_history(search=search, status_filter=status_filter, limit=limit, offset=offset)
    return jsonify({"success": True, "data": result})

@api_bp.route("/analytics", methods=["GET"])
def get_analytics():
    data = inv_service.get_analytics_data()
    return jsonify({"success": True, "data": data})

@api_bp.route("/reports/export", methods=["GET"])
def export_report():
    csv_content = inv_service.export_reconciliations_csv()
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=amazon_inventory_reconciliation_report.csv"}
    )

@api_bp.route("/sample-images", methods=["GET"])
def list_sample_images():
    """Lists preloaded test bin images available for testing."""
    samples = []
    if os.path.exists(SAMPLE_FOLDER):
        for fname in os.listdir(SAMPLE_FOLDER):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                samples.append({
                    "filename": fname,
                    "url": f"/uploads/{fname}",
                    "expected_count": int(fname.split("_")[2]) if "_items" in fname and fname.split("_")[2].isdigit() else None
                })
    return jsonify({"success": True, "data": samples})

@api_bp.route("/health", methods=["GET"])
def health_check():
    import torch
    model_status = predictor.get_status()
    return jsonify({
        "status": "healthy",
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "model_engine": model_status,
        "global_demo_mode": GLOBAL_SETTINGS["force_demo_mode"]
    })

@api_bp.route("/settings/demo-mode", methods=["POST"])
def toggle_demo_mode():
    data = request.get_json() or {}
    enable = data.get("enable")
    if enable is None:
        GLOBAL_SETTINGS["force_demo_mode"] = not GLOBAL_SETTINGS["force_demo_mode"]
    else:
        GLOBAL_SETTINGS["force_demo_mode"] = bool(enable)
        
    return jsonify({
        "success": True,
        "global_demo_mode": GLOBAL_SETTINGS["force_demo_mode"],
        "message": f"Global demo mode is now {'ENABLED' if GLOBAL_SETTINGS['force_demo_mode'] else 'DISABLED'}"
    })

@api_bp.route("/settings/seed", methods=["POST"])
def seed_database():
    success = seed_initial_data(force=True)
    return jsonify({
        "success": True,
        "message": "Database successfully re-seeded with sample bins and reconciliation records."
    })
