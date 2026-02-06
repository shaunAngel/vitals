from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load your models
current_dir = os.path.dirname(os.path.realpath(__file__))
clf = joblib.load(os.path.join(current_dir, 'risk_classifier.pkl'))
scaler = joblib.load(os.path.join(current_dir, 'scaler.pkl'))

@app.route('/predict', methods=['POST'])
def predict():
    try:
        raw_data = request.json.get('vitals', [])
        print(f"DEBUG: Data Received -> {raw_data}") # Check this in your terminal!

        # Data validation
        if len(raw_data) != 8:
            return jsonify({"error": f"Model needs 8 features, got {len(raw_data)}"}), 400

        # Convert to float and predict
        features = np.array([float(x) for x in raw_data]).reshape(1, -1)
        scaled_features = scaler.transform(features)
        risk_prob = clf.predict_proba(scaled_features)[0][1]
        
        return jsonify({
            "riskScore": int(risk_prob * 100),
            "status": "High" if risk_prob > 0.5 else "Stable"
        })
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)