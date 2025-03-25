import pandas as pd
import json
import os

# File handling

file_name = "processed_events.json"


# Load JSON data
with open(file_name, 'r') as f:
    M_and_D_sensors_labeled_SensorsIntegration = json.load(f)

# Convert JSON data to DataFrame
df = pd.DataFrame(M_and_D_sensors_labeled_SensorsIntegration)

# Save DataFrame to CSV
csv_file_name =  "processed_events.csv"
df.to_csv(csv_file_name, index=False)

print(f"Data successfully saved to {csv_file_name}")