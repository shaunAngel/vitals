#!/usr/bin/env python3
"""Retrain the ML model with correct feature scaling"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

print("🔄 Retraining ML Model...")

# Load dataset
try:
    df = pd.read_csv('human_vital_signs_dataset_2024.csv')
    print(f"✅ Dataset loaded: {df.shape}")
except:
    print("⚠️ Dataset not found, creating synthetic training data...")
    # Create synthetic data for training
    np.random.seed(42)
    n_samples = 200
    
    # Healthy vitals
    healthy = np.random.normal(
        [75, 16, 36.8, 97, 120, 80, 24, 93],
        [8, 2, 0.3, 1, 10, 8, 2, 5],
        (n_samples // 2, 8)
    )
    healthy_labels = np.zeros(n_samples // 2)
    
    # High-risk vitals
    high_risk = np.random.normal(
        [110, 24, 38.5, 92, 150, 95, 28, 115],
        [15, 3, 0.5, 3, 15, 10, 3, 8],
        (n_samples // 2, 8)
    )
    high_risk_labels = np.ones(n_samples // 2)
    
    # Combine
    X = np.vstack([healthy, high_risk])
    y = np.hstack([healthy_labels, high_risk_labels])
    
    print(f"✅ Synthetic data created: {X.shape}")
    print(f"   Healthy samples: {np.sum(y == 0)}, High-risk samples: {np.sum(y == 1)}")

if isinstance(df, pd.DataFrame):
    # Use correct feature columns from the dataset
    feature_names = ['Heart Rate', 'Respiratory Rate', 'Body Temperature', 'Oxygen Saturation', 
                     'Systolic Blood Pressure', 'Diastolic Blood Pressure', 'Derived_BMI', 'Derived_MAP']
    
    # Extract features
    X = df[feature_names].dropna().values.astype(np.float32)
    print(f"✅ Features extracted: {X.shape}")
    
    # Use the Risk Category from dataset
    if 'Risk Category' in df.columns:
        y_temp = df.loc[df[feature_names].notna().all(axis=1), 'Risk Category']
        # Convert string labels to binary
        y = np.array([1 if 'High' in str(label) else 0 for label in y_temp], dtype=np.int32)
    else:
        y = np.zeros(len(X), dtype=np.int32)
    
    print(f"   Risk distribution: {np.sum(y == 0)} healthy, {np.sum(y == 1)} high-risk")

# Ensure data is valid
X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int32)

print("\n🔧 Training Models...")

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"✅ Scaler fitted: expecting {X_scaled.shape[1]} features")

# Train classifier
clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
clf.fit(X_scaled, y)

# Evaluate
train_score = clf.score(X_scaled, y)
print(f"✅ Classifier trained: accuracy = {train_score:.2f}")
print(f"   Classes: {clf.classes_}")

# Save models
joblib.dump(scaler, 'scaler.pkl')
joblib.dump(clf, 'risk_classifier.pkl')

print("\n🎉 SUCCESS! Models saved:")
print("   - scaler.pkl")
print("   - risk_classifier.pkl")

# Test the model
print("\n🧪 Testing with sample data...")
test_samples = np.array([
    [75, 16, 36.8, 97, 120, 80, 24, 93],      # Healthy
    [110, 24, 38.5, 92, 150, 95, 28, 115],    # High-risk
])
test_scaled = scaler.transform(test_samples)
probs = clf.predict_proba(test_scaled)
print(f"   Classes available: {clf.classes_}")
if len(clf.classes_) > 1:
    print(f"   Healthy prediction: {probs[0][1]:.2%}")
    print(f"   High-risk prediction: {probs[1][1]:.2%}")
else:
    print("   ⚠️ Only one class in training data, using predictions directly:")
    preds = clf.predict(test_scaled)
    print(f"   Healthy prediction: {preds[0]}")
    print(f"   High-risk prediction: {preds[1]}")
