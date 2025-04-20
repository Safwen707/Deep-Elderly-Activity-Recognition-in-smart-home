"""
updated-cross-validation-with-time-features.py

This file implements a k-fold cross-validation approach for activity recognition using LSTM models and
time-based features with improved validation strategy:

1. Initial 80/20 split (train+CV vs. hold-out) to prevent data leakage
2. 10-fold cross-validation on the 80% portion
3. Internal 90/10 validation split for each fold
4. F1 score calculation via callback instead of in model.compile
5. Final evaluation on the 20% hold-out set

Key improvements:
- More robust validation strategy with proper hold-out testing
- Standardization performed correctly within each fold
- Consistent evaluation methodology across validation sets
"""
# Import required libraries
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import StratifiedKFold, train_test_split
import os
from datetime import datetime, timedelta
import json
import pickle
import tensorflow as tf
# FIXED: Added import for Callback
from tensorflow.keras.callbacks import Callback, EarlyStopping, ReduceLROnPlateau
# Import functions from Create_LSTM_Input.py
from Create_LSTM_Input import encode_cyclical_feature, extract_time_features, create_dataset, save_dataset_to_file

# Custom F1 Score metrics for Keras via callback
class F1ScoreCallback(Callback):
    def __init__(self, validation_data=None, **kwargs):
        super(F1ScoreCallback, self).__init__(**kwargs)
        self.validation_data = validation_data
        self.val_f1s = []
        
    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        if self.validation_data:
            X_val, y_val = self.validation_data
            val_predict = np.argmax(self.model.predict(X_val), axis=1)
            # Calculate F1 score - weighted average of all classes
            _val_f1 = f1_score(y_val, val_predict, average='weighted')
            self.val_f1s.append(_val_f1)
            # Add to logs for history tracking
            logs['val_f1'] = _val_f1
            print(f' - val_f1: {_val_f1:.4f}')

# Function to create and train LSTM model - updated to remove f1_keras
def create_model(input_shape, num_classes):
    model = Sequential()
    model.add(Bidirectional(LSTM(256, activation='tanh', return_sequences=True), 
                          input_shape=input_shape))
    model.add(Dropout(0.2))
    model.add(LSTM(128, activation='tanh'))
    model.add(Dropout(0.2))
    model.add(Dense(128, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(64, activation='relu'))
    model.add(Dense(num_classes, activation='softmax'))
    
    model.compile(
        optimizer='adam', 
        loss='sparse_categorical_crossentropy', 
        metrics=['accuracy']  # Removed f1_keras, using callback instead
    )
    
    return model

# Main execution
if __name__ == "__main__":
    print("\nStep 1: Data Preparation")
    
    # File handling
    import os
    file_path = os.path.join('LSTM_Model', 'time_based_segmentation', 'M_and_D_sensors_labeled_AllSensors.json')

    # Define the directory for saving models and dependencies
    save_dir = os.path.join('LSTM_Model', 'time_based_segmentation', 'scaler_and_dependencies')
    # Create directory if it doesn't exist
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        print(f"Created directory: {save_dir}")

    with open(file_path, 'r') as f:
        M_and_D_sensors_labeled_AllSensors = json.load(f)

    if not M_and_D_sensors_labeled_AllSensors:
        print("❌ Error: Data not loaded")
        exit(1)

    print("Creating dataset with extended time features...")
    X, y = create_dataset(M_and_D_sensors_labeled_AllSensors)
    print(f"Dataset created with {len(X)} sequences")
    print(f"Feature vector size: {X.shape[1]} (includes start/end time features, duration, and sensor data)")
    print("saving data")
    save_dataset_to_file(X, y, "featureExtracted_AllSensors_ExtendedTimeFeatures.txt")
    print("data saved")
    
    # Display feature information
    sensor_count = 31 + 3  # M001-M031 + D001, D003, D004
    time_feature_count = 24 + 1  # 12 start features + 12 end features + 1 duration feature
    print(f"Sensor features: {sensor_count}")
    print(f"Time features: {time_feature_count}")
    print(f"Total features: {sensor_count + time_feature_count}")
    
    # Label encoding
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    num_classes = len(label_encoder.classes_)
    print(f"Number of activity classes: {num_classes}")
    
    # NEW: Initial train+CV / hold-out split (80% / 20%)
    print("\nStep 2: Performing initial 80/20 train/hold-out split")
    X_train_cv, X_holdout, y_train_cv, y_holdout = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Training+CV data: {X_train_cv.shape}, Hold-out data: {X_holdout.shape}")
    
    # Step 3: Cross-Validation Implementation
    print("\nStep 3: Implementing K-Fold Cross-Validation on 80% of data")
    
    n_splits = 10  # Number of folds
    kf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    # Metrics storage
    cv_accuracy = []
    cv_f1_scores = []
    cv_histories = []
    
    # For visualization
    plt.figure(figsize=(15, 15))
    
    fold = 1
    best_model = None
    best_f1 = 0
    best_scaler = None
    
    for train_index, val_index in kf.split(X_train_cv, y_train_cv):
        print(f"\n\n{'='*50}")
        print(f"Fold {fold}/{n_splits}")
        print(f"{'='*50}")
        
        # Split data for this fold
        X_train_fold, X_val_fold = X_train_cv[train_index], X_train_cv[val_index]
        y_train_fold, y_val_fold = y_train_cv[train_index], y_train_cv[val_index]
        
        print(f"[Fold {fold}] Train shape: {X_train_fold.shape}, Val shape: {X_val_fold.shape}")
        
        # Standardize features - using only training data for fitting
        scaler = StandardScaler()
        X_train_fold_scaled = scaler.fit_transform(X_train_fold)
        X_val_fold_scaled = scaler.transform(X_val_fold)
        
        # Reshape data for LSTM
        time_steps = 1
        X_train_fold_scaled = X_train_fold_scaled.reshape((X_train_fold_scaled.shape[0], time_steps, X_train_fold_scaled.shape[1]))
        X_val_fold_scaled = X_val_fold_scaled.reshape((X_val_fold_scaled.shape[0], time_steps, X_val_fold_scaled.shape[1]))
        
        # Create model
        model = create_model(input_shape=(time_steps, X_train_fold.shape[1]), num_classes=num_classes)
        
        # Define callbacks
        f1_callback = F1ScoreCallback(validation_data=(X_val_fold_scaled, y_val_fold))
        early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
        reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=0.0001)
        
        # Train model
        print(f"\nTraining model for fold {fold}...")
        history = model.fit(
            X_train_fold_scaled, y_train_fold,
            epochs=50,  
            batch_size=32,
            validation_data=(X_val_fold_scaled, y_val_fold),
            callbacks=[f1_callback, early_stopping, reduce_lr],
            verbose=1
        )
        
        # Evaluate model
        print(f"\nEvaluating model for fold {fold}...")
        val_predictions = model.predict(X_val_fold_scaled)
        predicted_classes = np.argmax(val_predictions, axis=1)
        
        # Calculate metrics
        accuracy = accuracy_score(y_val_fold, predicted_classes)
        f1 = f1_score(y_val_fold, predicted_classes, average='weighted')
        
        print(f"Fold {fold} - Accuracy: {accuracy:.4f}, F1 Score: {f1:.4f}")
        
        # Track best model based on F1 score
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_scaler = scaler
            print(f"New best model found in fold {fold} with F1: {best_f1:.4f}")
        
        # Store metrics
        cv_accuracy.append(accuracy)
        cv_f1_scores.append(f1)
        cv_histories.append({
            'loss': history.history['loss'],
            'val_loss': history.history['val_loss'],
            'accuracy': history.history['accuracy'],
            'val_accuracy': history.history['val_accuracy'],
            'val_f1': f1_callback.val_f1s
        })
        
        # Plot training progress for this fold
        plt.subplot(n_splits, 3, (fold-1)*3 + 1)
        plt.plot(history.history['loss'], label='Train Loss')
        plt.plot(history.history['val_loss'], label='Validation Loss')
        plt.title(f"Fold {fold} - Loss")
        plt.legend()
        
        plt.subplot(n_splits, 3, (fold-1)*3 + 2)
        plt.plot(history.history['accuracy'], label='Train Accuracy')
        plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
        plt.title(f"Fold {fold} - Accuracy")
        plt.legend()
        
        plt.subplot(n_splits, 3, (fold-1)*3 + 3)
        plt.plot(f1_callback.val_f1s, label='Validation F1 Score')
        plt.title(f"Fold {fold} - F1 Score")
        plt.legend()
        
        # Print classification report for this fold
        print("\nClassification Report for fold {}:".format(fold))
        print(classification_report(
            y_val_fold,
            predicted_classes,
            target_names=label_encoder.classes_,
            zero_division=0
        ))
        
        # Save model and scaler for this fold
        model_path = os.path.join(save_dir, f"lstm_activity_classifier_fold{fold}.keras")
        model.save(model_path)
        print(f"Model saved to {model_path}")
        
        scaler_path = os.path.join(save_dir, f"feature_scaler_fold{fold}.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        print(f"Scaler saved to {scaler_path}")
        
        # Increment fold counter
        fold += 1
    
    # Step 4: Final evaluation on hold-out set
    print("\nStep 4: Final evaluation on 20% hold-out set")
    
    # Scale and reshape hold-out data using best scaler
    X_holdout_scaled = best_scaler.transform(X_holdout)
    X_holdout_scaled = X_holdout_scaled.reshape((X_holdout_scaled.shape[0], time_steps, X_holdout_scaled.shape[1]))
    
    # Evaluate on hold-out set
    holdout_predictions = best_model.predict(X_holdout_scaled)
    holdout_classes = np.argmax(holdout_predictions, axis=1)
    
    # Calculate final metrics
    holdout_accuracy = accuracy_score(y_holdout, holdout_classes)
    holdout_f1 = f1_score(y_holdout, holdout_classes, average='weighted')
    
    print(f"\nHold-out Set Results:")
    print(f"Accuracy: {holdout_accuracy:.4f}")
    print(f"F1 Score: {holdout_f1:.4f}")
    
    print("\nClassification Report for Hold-out Set:")
    print(classification_report(
        y_holdout,
        holdout_classes,
        target_names=label_encoder.classes_,
        zero_division=0
    ))
    
    # Finalize and display overall cross-validation results
    plt.tight_layout()
    plot_path = os.path.join(save_dir, 'cross_validation_results.png')
    plt.savefig(plot_path)
    print(f"Cross-validation plot saved to {plot_path}")
    plt.show()
    
    # Save the best model and scaler
    best_model_path = os.path.join(save_dir, "best_lstm_model.keras")
    best_model.save(best_model_path)
    print(f"Best model saved to {best_model_path}")
    
    best_scaler_path = os.path.join(save_dir, "best_feature_scaler.pkl")
    with open(best_scaler_path, 'wb') as f:
        pickle.dump(best_scaler, f)
    print(f"Best scaler saved to {best_scaler_path}")
    
    # Plot feature importance using the best model
    # Get the weights of the first layer
    first_layer_weights = np.abs(best_model.layers[0].get_weights()[0]).mean(axis=(1))
    
    # Create feature names for visualization
    feature_names = []
    
    # Start time features
    for prefix in ["start_", "end_"]:
        for component in ["hour", "minute", "day", "month", "day_of_week"]:
            for encoding in ["sin", "cos"]:
                feature_names.append(f"{prefix}{component}_{encoding}")
    
    # Duration feature
    feature_names.append("activity_duration_normalized")
    
    # Sensor features
    for i in range(1, 32):
        feature_names.append(f"M{i:03d}")
    feature_names.extend(["D001", "D003", "D004"])
    
    # Sort features by importance
    indices = np.argsort(first_layer_weights)[::-1]
    plt.figure(figsize=(12, 8))
    plt.bar(range(len(indices)), first_layer_weights[indices])
    plt.xticks(range(len(indices)), [feature_names[i] for i in indices], rotation=90)
    plt.title('Approximate Feature Importance based on Layer Weights')
    plt.tight_layout()
    importance_plot_path = os.path.join(save_dir, 'feature_importance.png')
    plt.savefig(importance_plot_path)
    print(f"Feature importance plot saved to {importance_plot_path}")
    
    # Print average metrics from cross-validation
    print("\n\n" + "="*50)
    print("CROSS-VALIDATION RESULTS")
    print("="*50)
    print(f"Number of folds: {n_splits}")
    print(f"Average Accuracy: {np.mean(cv_accuracy):.4f} ± {np.std(cv_accuracy):.4f}")
    print(f"Average F1 Score: {np.mean(cv_f1_scores):.4f} ± {np.std(cv_f1_scores):.4f}")
    
    # Save label encoder classes for future use
    classes_path = os.path.join(save_dir, 'activity_classes.npy')
    np.save(classes_path, label_encoder.classes_)
    print(f"\nActivity classes saved to {classes_path}")
    
    # Final summary
    print("\n" + "="*50)
    print("FINAL SUMMARY")
    print("="*50)
    print(f"Cross-validation (internal): Acc = {np.mean(cv_accuracy):.4f}, F1 = {np.mean(cv_f1_scores):.4f}")
    print(f"Hold-out (20% test set): Acc = {holdout_accuracy:.4f}, F1 = {holdout_f1:.4f}")
    print("\nCross-validation and evaluation complete!")