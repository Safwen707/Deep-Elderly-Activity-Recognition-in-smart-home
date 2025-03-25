import csv
import json

def csv_to_json(csv_file, json_file):
    data = []
    
    # Read the CSV file
    with open(csv_file, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            data.append(row)
    
    # Write to JSON file
    with open(json_file, mode='w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)
    
    print(f"CSV data has been successfully converted to {json_file}")

# Example usage
csv_to_json('M_and_D_sensors_labeled_AllSensors.csv', 'M_and_D_sensors_labeled_AllSensors.json')
