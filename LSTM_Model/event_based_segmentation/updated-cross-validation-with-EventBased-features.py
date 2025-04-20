
"""
updated-cross-validation-with-time-features.py

Ce script implémente :
- Un split initial 80 % / 20 % (hold-out) sans fuite de données.
- Une validation interne 90 % / 10 % pour chaque pli de CV.
- Suppression de f1_keras de model.compile : F1 calculé en post‑training.
- Évaluation finale sur le hold-out une seule fois.
"""

import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from sklearn.metrics import accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import StratifiedKFold, train_test_split
import os
import json
import pickle
from tensorflow.keras.callbacks import Callback, EarlyStopping, ReduceLROnPlateau
from Create_LSTM_Input import create_dataset

# Callback pour calculer F1 sur split interne
class F1ScoreCallback(Callback):
    def __init__(self, validation_data=None, **kwargs):
        super(F1ScoreCallback, self).__init__(**kwargs)
        self.validation_data = validation_data
        self.val_f1s = []

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        X_val, y_val = self.validation_data
        y_pred = np.argmax(self.model.predict(X_val), axis=1)
        f1 = f1_score(y_val, y_pred, average='weighted')
        self.val_f1s.append(f1)
        logs['val_f1'] = f1
        print(f" - val_f1: {f1:.4f}")

# Architecture LSTM (sans f1_keras)
def create_model(input_shape, num_classes):
    model = Sequential([
        Bidirectional(LSTM(256, return_sequences=True), input_shape=input_shape),
        Dropout(0.2),
        LSTM(128),
        Dropout(0.2),
        Dense(128, activation='relu'),
        Dropout(0.2),
        Dense(64, activation='relu'),
        Dense(num_classes, activation='softmax'),
    ])
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']  # F1 retiré
    )
    return model

if __name__ == "__main__":
    # 1) Chargement et préparation
    with open('LSTM_Model/event_based_segmentation/M_and_D_sensors_labeled_AllSensors.json') as f:
        data = json.load(f)
    X, y = create_dataset(data,10)
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    num_classes = len(le.classes_)

    # 2) Split initial : 80% CV, 20% hold-out
    X_cv, X_hold, y_cv, y_hold = train_test_split(
        X, y_enc, test_size=0.2, stratify=y_enc, random_state=42
    )

    # Dossier de sauvegarde global
    sd = 'LSTM_Model/event_based_segmentation/scaler_and_dependencies'
    os.makedirs(sd, exist_ok=True)

    # 3) CV interne 10 plis
    skf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    cv_acc, cv_f1 = [], []
    plt.figure(figsize=(18, 10 * 3))

    fold = 1
    for train_idx, val_idx in skf.split(X_cv, y_cv):
        print(f"Traitement du fold {fold}")
        

        # split 90/10 interne
        X_train, X_val = X_cv[train_idx], X_cv[val_idx]
        y_train, y_val = y_cv[train_idx], y_cv[val_idx]
        print(f"[Fold {fold}] Train shape: {X_train.shape}, Val shape: {X_val.shape}")
        print(f"[Fold {fold}] Unique y_train: {np.unique(y_train)}, y_val: {np.unique(y_val)}")
        # Standardisation (fit uniquement sur X_train)
        scaler = StandardScaler().fit(X_train)
        X_train_s = scaler.transform(X_train).reshape(-1, 1, X_train.shape[1])
        X_val_s = scaler.transform(X_val).reshape(-1, 1, X_val.shape[1])

        # Création du modèle
        model = create_model((1, X_train.shape[1]), num_classes)

        # Callbacks (sur split interne)
        f1_cb = F1ScoreCallback(validation_data=(X_val_s, y_val))
        es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
        rl = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-4)

        # Entraînement
        history = model.fit(
            X_train_s, y_train,
            epochs=50, batch_size=32,
            validation_data=(X_val_s, y_val),
            callbacks=[f1_cb, es, rl], verbose=1
        )

        # Évaluation interne
        y_val_pred = np.argmax(model.predict(X_val_s), axis=1)
        acc = accuracy_score(y_val, y_val_pred)
        f1 = f1_score(y_val, y_val_pred, average='weighted')
        cv_acc.append(acc)
        cv_f1.append(f1)

        # Tracé des courbes
        plt.subplot(10, 3, (fold - 1) * 3 + 1)
        plt.plot(history.history['loss'], label='train loss')
        plt.plot(history.history['val_loss'], label='val loss')
        plt.legend(); plt.title(f'Fold{fold} Loss')

        plt.subplot(10, 3, (fold - 1) * 3 + 2)
        plt.plot(history.history['accuracy'], label='train acc')
        plt.plot(history.history['val_accuracy'], label='val acc')
        plt.legend(); plt.title(f'Fold{fold} Acc')

        plt.subplot(10, 3, (fold - 1) * 3 + 3)
        plt.plot(f1_cb.val_f1s, label='val f1')
        plt.legend(); plt.title(f'Fold{fold} F1')

        # Sauvegarde modèle et scaler du pli
        model.save(f"{sd}/model_fold{fold}.keras")
        with open(f"{sd}/scaler_fold{fold}.pkl", "wb") as f:
            pickle.dump(scaler, f)

        fold += 1

    # Finalisation des plots CV
    plt.tight_layout()
    plt.savefig(f"{sd}/cv_plots.png")
    plt.show()

    # 4) Évaluation finale sur le hold-out (20%)
    final_scaler = StandardScaler().fit(X_cv)
    X_hold_s = final_scaler.transform(X_hold).reshape(-1, 1, X_hold.shape[1])
    best_model = model  # à remplacer par le meilleur si sélection
    y_hold_pred = np.argmax(best_model.predict(X_hold_s), axis=1)
    print("Hold-out Acc:", accuracy_score(y_hold, y_hold_pred))
    print("Hold-out F1: ", f1_score(y_hold, y_hold_pred, average='weighted'))

    # 5) Sauvegarde des classes
    np.save(f"{sd}/classes.npy", le.classes_)

