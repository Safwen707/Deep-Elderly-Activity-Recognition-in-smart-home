# Deep-Human-Activity-Recognition-in-smart-home
## Dataset Setup
## Dataset Setup

1. Download the JSON file from Kaggle:  
   - https://www.kaggle.com/datasets/safweneessayes/m-and-d-sensors  

2. Download the  M_and_D_sensors_labeled_AllSensors.json and M_and_D_sensors_labeled_AllSensors.csv files from Kaggle: 
https://www.kaggle.com/datasets/safweneessayes/m-and-d-sensors-labeled-allsensors
 This file is the result of the script activities-labeling. It consists of chunking the unlabeled data that is situated between the end of an activity and the beginning of another into chunks based on sudden changing sonsors and labeling them according to the files zoneTimeForEachActivity, Following&PrecedentActivitiesForEachActivity, and AllSensorsForEachActivities.

 3. Download the  featureExtracted_AllSensors_ExtendedTimeFeatures.txt file from Kaggle: 
https://www.kaggle.com/datasets/safweneessayes/featureextracted-allsensors-extendedtimefeatures

 This file contains the X and y vector : input of LSTM




This project is organized into several folders to ensure better management of the different stages of data processing and LSTM model training for activity recognition.

📂 cleaningData
This folder contains the scripts and tools necessary for data preprocessing. This includes cleaning outliers, handling missing values, and normalizing data.

📂 documentation
Folder containing project documentation, including technical reports, model descriptions, and methodologies used.

📂 labelingMissingLine
Scripts for identifying and processing missing lines in the dataset, correctly labeling them based on abrupt sensor changes to avoid any loss of important information.

📂 LSTM_Model
Contains files related to the LSTM model, including the creation of appropriate input and model training (file "updated-cross-validation-with-time-features").

📂 scaler_and_dependencies
Folder grouping the necessary files to load the model and use it in other scripts.




mobile part 
Summary of the Logic (Flow of Execution):
                      Setup and Imports:

Necessary libraries and helper functions (e.g. create_dataset) are imported.

A custom F1-score metric is defined to be used when loading the trained model.

                 Model and Scaler Loading:

On server start, the trained LSTM model, the scaler used during training, and the list of activity labels are loaded once and reused for all API requests.

                       Preprocessing & Feature Extraction:

When sensor data is sent to the API, it's split into batches.

Each batch is processed into the format expected by the LSTM model using the same logic used during training.

           Prediction Logic:

The input data is scaled and reshaped.

The LSTM model predicts the activity class.

Confidence score is extracted (highest softmax probability).

Precision and F1-score are approximated using confidence as a proxy (since true labels aren't available).

     API Endpoint /predict:

Receives a JSON POST request with sensor events and optional batch size.

Returns predicted activity, confidence, and metrics for each batch.

Also includes timestamps and handles errors gracefully.

            Execution:

The Flask server listens on port 5000 (or from env variable) and waits for incoming prediction requests.

