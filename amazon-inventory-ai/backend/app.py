import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from config import UPLOAD_FOLDER, SAMPLE_FOLDER
from database import init_db, seed_initial_data
from routes.api import api_bp

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize DB and seed initial data if first run
    init_db()
    seed_initial_data(force=False)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix="/api")
    
    # Static files route for uploaded images
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        # Check in uploads first, then sample_images
        if os.path.exists(os.path.join(UPLOAD_FOLDER, filename)):
            return send_from_directory(UPLOAD_FOLDER, filename)
        elif os.path.exists(os.path.join(SAMPLE_FOLDER, filename)):
            return send_from_directory(SAMPLE_FOLDER, filename)
        return jsonify({"error": "Image file not found"}), 404

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    print("[*] Starting Amazon Inventory Reconciliation Backend Server...")
    app.run(host="127.0.0.1", port=5000, debug=True)
