import re
import ast
import numpy as np
import tensorflow as tf
import pickle
from sklearn.metrics import classification_report, f1_score

# -------------------------------
# Step 1: Parse features from text file
# -------------------------------
def parse_feature_file(filename):
    """
    Parses a feature file containing blocks of X[i] and y[i] entries.
    Returns two lists: features (dicts) and labels.
    """
    X = []
    y = []

    with open(filename, 'r') as f:
        content = f.read()

    blocks = content.split("__________________________________________________")
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # Extract features
        match = re.search(r"X\[\d+\]:\s*\[(.*?)\]\s*", block, re.DOTALL)
        if match:
            features_text = match.group(1).strip()
            lines = features_text.splitlines()
            cleaned_lines = []
            for line in lines:
                line = line.split('#')[0].strip()
                if line.endswith(','):
                    line = line[:-1].strip()
                if line:
                    cleaned_lines.append(line)
            dict_str = "{" + ", ".join(cleaned_lines) + "}"
            try:
                feature_dict = ast.literal_eval(dict_str)
                X.append(feature_dict)
            except Exception as e:
                print(f"Error parsing block: {e}")
                continue
        else:
            print("No features found in block:")
            print(block)
            continue

        # Extract label (if exists)
        match_y = re.search(r"y\[\d+\]:\s*'([^']*)'", block)
        if match_y:
            label = match_y.group(1)
            y.append(label if label and label.lower() != "none" else None)
        else:
            y.append(None)

    return X, y

# -------------------------------
# Step 2: Load and prepare data
# -------------------------------
feature_file = "LSTM_Model/event_based_segmentation/featureExtracted(w=5).txt"
X_all, y_all = parse_feature_file(feature_file)

# Convert all to labeled
X_labeled = X_all
y_labeled = y_all

# Simulate unlabeled data (for prediction only)
X_unlabeled = X_all.copy()

print(f"Loaded {len(X_all)} samples:")
print(f"  {len(X_labeled)} labeled")
print(f"  {len(X_unlabeled)} used as unlabeled for prediction")

# -------------------------------
# Step 3: Define feature names (must match the order in the .txt)
# -------------------------------
feature_names = [
    'start_hour_sin', 'start_hour_cos', 'start_minute_sin', 'start_minute_cos',
    'start_day_sin', 'start_day_cos', 'start_month_sin', 'start_month_cos',
    'start_day_of_week_sin', 'start_day_of_week_cos',
    'end_hour_sin', 'end_hour_cos', 'end_minute_sin', 'end_minute_cos',
    'end_day_sin', 'end_day_cos', 'end_month_sin', 'end_month_cos',
    'end_day_of_week_sin', 'end_day_of_week_cos',
    'activity_duration_normalized'
]
for i in range(1, 32):
    feature_names.append(f"M{i:03d}")
feature_names.extend(["D001", "D003", "D004"])

# -------------------------------
# Step 4: Helper to convert dict -> vector
# -------------------------------
def features_to_vector(feature_dict, feature_names):
    return np.array([feature_dict.get(name, 0.0) for name in feature_names], dtype=np.float32)

# Convert to NumPy arrays
X_labeled_np = np.array([features_to_vector(f, feature_names) for f in X_labeled])
X_unlabeled_np = np.array([features_to_vector(f, feature_names) for f in X_unlabeled])

# -------------------------------
# Step 5: Load model, scaler, and classes
# -------------------------------
model_path = 'LSTM_Model/event_based_segmentation/scaler_and_dependencies/lstm_activity_classifier_fold1_with_extended_time.keras'
scaler_path = 'LSTM_Model/event_based_segmentation/scaler_and_dependencies/feature_scaler_fold1_with_extended_time.pkl'
classes_path = 'LSTM_Model/event_based_segmentation/scaler_and_dependencies/activity_classes.npy'

print("Loading model...")
model = tf.keras.models.load_model(model_path, compile=False)

print("Loading scaler...")
with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)

print("Loading class labels...")
class_labels = np.load(classes_path, allow_pickle=True)
print(f"Activity classes: {class_labels}")

# -------------------------------
# Step 6: Predict on unlabeled data
# -------------------------------
if X_unlabeled_np.size == 0:
    print("No unlabeled data available.")
else:
    print("Standardizing and predicting on unlabeled data...")
    X_unlabeled_scaled = scaler.transform(X_unlabeled_np)
    X_unlabeled_scaled = X_unlabeled_scaled.reshape((X_unlabeled_scaled.shape[0], 1, X_unlabeled_scaled.shape[1]))
    preds_unlabeled = model.predict(X_unlabeled_scaled)
    pred_classes_unlabeled = np.argmax(preds_unlabeled, axis=1)
    pred_activities_unlabeled = class_labels[pred_classes_unlabeled]

    print("\nPredictions on unlabeled data:")
    for i, activity in enumerate(pred_activities_unlabeled[:20]):
        print(f"Sample {i+1}: Predicted Activity: {activity}")

# -------------------------------
# Step 7: Evaluate on labeled data
# -------------------------------
if len(X_labeled_np) > 0:
    print("Standardizing and evaluating labeled data...")
    X_labeled_scaled = scaler.transform(X_labeled_np)
    X_labeled_scaled = X_labeled_scaled.reshape((X_labeled_scaled.shape[0], 1, X_labeled_scaled.shape[1]))
    preds_labeled = model.predict(X_labeled_scaled)
    pred_classes_labeled = np.argmax(preds_labeled, axis=1)
    pred_activities_labeled = class_labels[pred_classes_labeled]

    unique_acts = np.unique(np.append(y_labeled, pred_activities_labeled))
    label_map = {label: i for i, label in enumerate(unique_acts)}
    y_true_idx = np.array([label_map[y] for y in y_labeled])
    y_pred_idx = np.array([label_map[y] for y in pred_activities_labeled])

    print("\nF1 Score Report:")
    report = classification_report(y_true_idx, y_pred_idx, target_names=unique_acts, output_dict=True)

    for activity in unique_acts:
        print(f"{activity}: {report[activity]['f1-score']:.4f}")
    print(f"\nOverall Weighted F1 Score: {report['weighted avg']['f1-score']:.4f}")
    print(f"Overall Macro F1 Score: {report['macro avg']['f1-score']:.4f}")

# -------------------------------
# Step 8: Save results to file
# -------------------------------
with open('prediction_results.txt', 'w') as f:
    f.write("Predictions on Unlabeled Data:\n")
    for i, act in enumerate(pred_activities_unlabeled):
        f.write(f"Sample {i+1}: {act}\n")

    f.write("\n\nLabeled Data Evaluation:\n")
    for i in range(len(pred_activities_labeled)):
        f.write(f"Sample {i+1}: Predicted: {pred_activities_labeled[i]} | True: {y_labeled[i]}\n")

    f.write("\nF1 Scores by Activity:\n")
    for activity in unique_acts:
        f.write(f"{activity}: {report[activity]['f1-score']:.4f}\n")
    f.write(f"\nWeighted F1: {report['weighted avg']['f1-score']:.4f}\n")
    f.write(f"Macro F1: {report['macro avg']['f1-score']:.4f}\n")

print("\n✅ All results saved to prediction_results.txt")
