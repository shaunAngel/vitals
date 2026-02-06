from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)

# Load your models
current_dir = os.path.dirname(os.path.realpath(__file__))
try:
    clf = joblib.load(os.path.join(current_dir, 'risk_classifier.pkl'))
    scaler = joblib.load(os.path.join(current_dir, 'scaler.pkl'))
except:
    print("⚠️ Models not found or corrupted. Using dummy scaler.")
    # Fallback: create a basic scaler manually
    scaler = StandardScaler()
    # Pre-fit with typical vital sign ranges
    dummy_data = np.array([
        [60, 12, 36.0, 95, 90, 60, 18, 70],
        [100, 20, 38, 98, 140, 90, 30, 110],
        [80, 16, 37, 97, 120, 80, 25, 93],
    ])
    scaler.fit(dummy_data)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        raw_data = request.json.get('vitals', [])
        print(f"DEBUG: Data Received -> {raw_data}") # Check this in your terminal!

        # Data validation
        if len(raw_data) != 8:
            return jsonify({"error": f"Model needs 8 features, got {len(raw_data)}"}), 400

        # Convert to float - order from frontend: [hr, resp, temp, spo2, sysBP, diaBP, bmi, map]
        # Model expects: [Heart Rate, Respiratory Rate, Body Temperature, Oxygen Saturation, 
        #                 Systolic BP, Diastolic BP, BMI, MAP]
        # These match perfectly!
        features = np.array([[float(x) for x in raw_data]])
        
        print(f"DEBUG: Features -> {features}")
        print(f"DEBUG: Scaler n_features: {scaler.n_features_in_}")
        
        scaled_features = scaler.transform(features)
        print(f"DEBUG: Scaled features -> {scaled_features}")
        
        prediction = clf.predict(scaled_features)[0]
        risk_prob = clf.predict_proba(scaled_features)[0][1] if len(clf.classes_) > 1 else float(prediction)
        
        print(f"DEBUG: Prediction -> {prediction}, Probability -> {risk_prob}")
        
        return jsonify({
            "riskScore": int(risk_prob * 100),
            "status": "High" if risk_prob > 0.5 else "Stable"
        })
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)

@app.route('/test-model', methods=['GET'])
def test_model():
    """Test with known high-risk values"""
    try:
        # High risk scenario: high HR, high temp, high BP, low O2
        high_risk_features = np.array([[120, 22, 39, 92, 160, 100, 28, 120]])
        scaled = scaler.transform(high_risk_features)
        prob = clf.predict_proba(scaled)[0][1]
        
        # Normal scenario
        normal_features = np.array([[75, 16, 36.8, 98, 120, 80, 22, 93]])
        scaled_normal = scaler.transform(normal_features)
        prob_normal = clf.predict_proba(scaled_normal)[0][1]
        
        return jsonify({
            "high_risk_test": {"values": high_risk_features.tolist()[0], "probability": float(prob)},
            "normal_test": {"values": normal_features.tolist()[0], "probability": float(prob_normal)},
            "model_classes": clf.classes_.tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500