
"""
Create_LSTM_Input.py

This file focuses on preparing time-series data for LSTM-based activity recognition. Its main functions:

1. encode_cyclical_feature(): Encodes cyclical features (like hours, days, months) using sine and cosine
   transformations to preserve their periodicity.

2. extract_time_features(): Extracts temporal features from datetime objects, encoding them as cyclical 
   components with sin/cos values to capture time patterns.

3. create_dataset(): The core function that processes sensor event data to create feature vectors for LSTM.
   It tracks activity start/end times, calculates durations, extracts time features, and counts sensor
   activations to build a comprehensive feature set.

4. save_dataset_to_file(): Outputs the generated dataset to a text file with labeled features for inspection.

The file handles complex event sequences by tracking overlapping activities, determining majority activities
in time windows, and encoding time data in a way that preserves cyclical relationships.
"""

import numpy as np
from datetime import datetime, timedelta

# Time feature encoding functions
def encode_cyclical_feature(value, period):
    """
    Encode a cyclical feature using sin and cos transformation to preserve periodicity.
    For example: hour of day (period=24), day of week (period=7), month (period=12)
    
    Args:
        value: The value to encode
        period: The period of the feature
        
    Returns:
        sin_component, cos_component as a tuple
    """
    sin_component = np.sin(2 * np.pi * value / period)
    cos_component = np.cos(2 * np.pi * value / period)
    return sin_component, cos_component

def extract_time_features(dt, prefix=""):
    """
    Extract and encode cyclical time features from a datetime object
    
    Args:
        dt: datetime object
        prefix: optional prefix for feature keys (e.g., "start_" or "end_")
        
    Returns:
        Dictionary of encoded time features
    """
    if dt is None:
        # Return zeros if no datetime is provided
        return {
            f'{prefix}hour_sin': 0,
            f'{prefix}hour_cos': 0,
            f'{prefix}minute_sin': 0,
            f'{prefix}minute_cos': 0,
            f'{prefix}second_sin': 0,
            f'{prefix}second_cos': 0,
            f'{prefix}day_sin': 0,
            f'{prefix}day_cos': 0,
            f'{prefix}month_sin': 0,
            f'{prefix}month_cos': 0,
            f'{prefix}day_of_week_sin': 0,
            f'{prefix}day_of_week_cos': 0,
            f'{prefix}time_of_day_sin': 0,
            f'{prefix}time_of_day_cos': 0
        }
    
    # Extract basic time components
    hour = dt.hour
    minute = dt.minute
    second = dt.second
    day = dt.day
    month = dt.month
    day_of_week = dt.weekday()  # 0-6 (Monday to Sunday)
    
    # Calculate total time in seconds for the day (0-86399)
    time_of_day = hour * 3600 + minute * 60 + second
    
    # Encode cyclical features
    hour_sin, hour_cos = encode_cyclical_feature(hour, 24)
    minute_sin, minute_cos = encode_cyclical_feature(minute, 60)
    second_sin, second_cos = encode_cyclical_feature(second, 60)
    day_sin, day_cos = encode_cyclical_feature(day, 31)  # Using 31 as max days in month
    month_sin, month_cos = encode_cyclical_feature(month, 12)
    day_of_week_sin, day_of_week_cos = encode_cyclical_feature(day_of_week, 7)
    time_of_day_sin, time_of_day_cos = encode_cyclical_feature(time_of_day, 86400)
    
    # Return encoded features with optional prefix
    return {
        f'{prefix}hour_sin': hour_sin,
        f'{prefix}hour_cos': hour_cos,
        f'{prefix}minute_sin': minute_sin,
        f'{prefix}minute_cos': minute_cos,
        f'{prefix}second_sin': second_sin,
        f'{prefix}second_cos': second_cos,
        f'{prefix}day_sin': day_sin,
        f'{prefix}day_cos': day_cos,
        f'{prefix}month_sin': month_sin,
        f'{prefix}month_cos': month_cos,
        f'{prefix}day_of_week_sin': day_of_week_sin,
        f'{prefix}day_of_week_cos': day_of_week_cos,
        f'{prefix}time_of_day_sin': time_of_day_sin,
        f'{prefix}time_of_day_cos': time_of_day_cos
    }

# Updated create_dataset function with start/end times and duration
def create_dataset(data, target_duration_seconds=300, tolerance_seconds=30):
    """
    Create a dataset for LSTM by segmenting data based on time duration instead of fixed event count.

    Args:
        data: List of sensor events with datetime information
        target_duration_seconds: Target duration for each segment in seconds (default: 5 minutes)
        tolerance_seconds: Allowed tolerance in seconds (default: 30 seconds)

    Returns:
        X: Feature vectors
        y: Activity labels
    """
    X, y = [], []
    all_sensors = [f"M{i:03d}" for i in range(1, 32)] + ["D001", "D003", "D004"]

    # Store active activities with their start time and index
    global_active_activities = {}  # Format: {activity: (start_idx, start_dt)}
    last_majority_activity = None

    # Define time feature names
    start_time_feature_names = [
        'start_hour_sin', 'start_hour_cos', 'start_minute_sin', 'start_minute_cos',
        'start_day_sin', 'start_day_cos', 'start_month_sin', 'start_month_cos',
        'start_day_of_week_sin', 'start_day_of_week_cos'
    ]
    end_time_feature_names = [
        'end_hour_sin', 'end_hour_cos', 'end_minute_sin', 'end_minute_cos',
        'end_day_sin', 'end_day_cos', 'end_month_sin', 'end_month_cos',
        'end_day_of_week_sin', 'end_day_of_week_cos'
    ]

    # Keep track of current processed index
    current_idx = 0

    while current_idx < len(data):
        # Get start time of the segment
        try:
            start_time = datetime.strptime(
                f"{data[current_idx]['date']} {data[current_idx]['time']}", 
                "%Y-%m-%d %H:%M:%S.%f"
            )
        except ValueError:
            try:
                start_time = datetime.strptime(
                    f"{data[current_idx]['date']} {data[current_idx]['time']}", 
                    "%Y-%m-%d %H:%M:%S"
                )
            except:
                # Skip invalid entries
                current_idx += 1
                continue

        # Initialisation de la séquence avec l'événement courant
        sequence_start_idx = current_idx
        
        # Exigence: Si une séquence ne comporte qu'une seule ligne et que la durée dépasse la borne supérieure
        # Vérifier l'écart avec l'événement suivant pour décider si on continue avec cette ligne
        next_idx = current_idx + 1
        next_time = None
        if next_idx < len(data):
            try:
                next_time = datetime.strptime(
                    f"{data[next_idx]['date']} {data[next_idx]['time']}", 
                    "%Y-%m-%d %H:%M:%S.%f"
                )
            except ValueError:
                try:
                    next_time = datetime.strptime(
                        f"{data[next_idx]['date']} {data[next_idx]['time']}", 
                        "%Y-%m-%d %H:%M:%S"
                    )
                except:
                    next_time = None
        
        # Si la durée entre la ligne actuelle et la suivante dépasse la borne supérieure,
        # ignorer la ligne actuelle et commencer avec la suivante
        if next_time and (next_time - start_time).total_seconds() > (target_duration_seconds + tolerance_seconds):
            current_idx += 1
            continue

        # Calculate target end time for this segment
        target_end_time = start_time + timedelta(seconds=target_duration_seconds)
        min_end_time = target_end_time - timedelta(seconds=tolerance_seconds)
        max_end_time = target_end_time + timedelta(seconds=tolerance_seconds)

        # Find the best segment end index within the tolerance range
        end_idx = current_idx + 1
        end_time = None

        while end_idx < len(data) and end_idx < current_idx + 1000:  # Safety limit
            try:
                event_time = datetime.strptime(
                    f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                    "%Y-%m-%d %H:%M:%S.%f"
                )
            except ValueError:
                try:
                    event_time = datetime.strptime(
                        f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                        "%Y-%m-%d %H:%M:%S"
                    )
                except:
                    # Skip invalid entries
                    end_idx += 1
                    continue
            
            # Exigence: Vérifier si la durée entre l'événement actuel et le précédent dépasse la borne supérieure
            prev_idx = end_idx - 1
            if prev_idx >= current_idx:
                try:
                    prev_time = datetime.strptime(
                        f"{data[prev_idx]['date']} {data[prev_idx]['time']}", 
                        "%Y-%m-%d %H:%M:%S.%f"
                    )
                except ValueError:
                    try:
                        prev_time = datetime.strptime(
                            f"{data[prev_idx]['date']} {data[prev_idx]['time']}", 
                            "%Y-%m-%d %H:%M:%S"
                        )
                    except:
                        prev_time = None
                
                # Si la (n+1)ème ligne dépasse la borne supérieure de l'intervalle,
                # terminer la séquence avec les n lignes précédentes
                if prev_time and (event_time - prev_time).total_seconds() > (target_duration_seconds + tolerance_seconds):
                    end_idx = prev_idx  # La séquence se termine à l'événement précédent
                    try:
                        end_time = datetime.strptime(
                            f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                            "%Y-%m-%d %H:%M:%S.%f"
                        )
                    except ValueError:
                        try:
                            end_time = datetime.strptime(
                                f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                                "%Y-%m-%d %H:%M:%S"
                            )
                        except:
                            end_time = prev_time
                    break

            # If we've reached the target duration (within tolerance)
            if event_time >= min_end_time:
                # If we're still within tolerance, this is our end point
                if event_time <= max_end_time:
                    end_time = event_time
                    break
                # If we've gone beyond the tolerance, use the previous index
                else:
                    end_idx -= 1
                    # Get the time of the previous event
                    try:
                        end_time = datetime.strptime(
                            f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                            "%Y-%m-%d %H:%M:%S.%f"
                        )
                    except ValueError:
                        try:
                            end_time = datetime.strptime(
                                f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                                "%Y-%m-%d %H:%M:%S"
                            )
                        except:
                            end_time = start_time + timedelta(seconds=target_duration_seconds)
                    break

            end_idx += 1

        # If we couldn't find a suitable end within tolerance, use whatever we have
        if end_idx >= len(data):
            end_idx = len(data) - 1
            try:
                end_time = datetime.strptime(
                    f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                    "%Y-%m-%d %H:%M:%S.%f"
                )
            except ValueError:
                try:
                    end_time = datetime.strptime(
                        f"{data[end_idx]['date']} {data[end_idx]['time']}", 
                        "%Y-%m-%d %H:%M:%S"
                    )
                except:
                    end_time = start_time + timedelta(seconds=target_duration_seconds)

        # Extract the sequence for this time segment
        sequence = data[current_idx:end_idx+1]

        # Exigence: Une séquence doit contenir au moins deux lignes pour être valide
        if len(sequence) < 2:
            current_idx = end_idx + 1
            continue

        # Calculate actual sequence duration
        if end_time:
            sequence_duration_sec = (end_time - start_time).total_seconds()
        else:
            sequence_duration_sec = target_duration_seconds

        # Normalize sequence duration
        sequence_duration_norm = sequence_duration_sec / 86400
        sequence_duration_norm = max(sequence_duration_norm, 0.0001)  # Avoid zero values

        # Copy global active activities with their complete history
        active_activities = global_active_activities.copy()
        activity_durations = {}

        # Process events in the sequence to calculate activity durations
        for j, event in enumerate(sequence):
            if event["activity"]:
                activity_parts = event["activity"].replace(" ", "").split(",")
                if len(activity_parts) != 2: continue
                activity_name, action = activity_parts

                # Parse datetime
                try:
                    event_dt = datetime.strptime(
                        f"{event['date']} {event['time']}", 
                        "%Y-%m-%d %H:%M:%S.%f"
                    )
                except ValueError:
                    try:
                        event_dt = datetime.strptime(
                            f"{event['date']} {event['time']}", 
                            "%Y-%m-%d %H:%M:%S"
                        )
                    except:
                        event_dt = datetime.now()

                # Exigence: Traiter le début et la fin d'une activité pour calculer sa durée
                if action == "begin":
                    active_activities[activity_name] = (j, event_dt)
                elif action == "end":
                    if activity_name in active_activities:
                        start_idx, start_dt = active_activities[activity_name]
                        duration_sec = (event_dt - start_dt).total_seconds()
                        # Exigence: Additionner les durées pour la même activité si elle apparaît plusieurs fois
                        if activity_name in activity_durations:
                            activity_durations[activity_name] += duration_sec
                        else:
                            activity_durations[activity_name] = duration_sec
                        del active_activities[activity_name]

        # Handle unfinished activities (activités commencées mais pas terminées)
        for activity, (start_idx, start_dt) in active_activities.items():
            try:
                last_event_dt = datetime.strptime(
                    f"{sequence[-1]['date']} {sequence[-1]['time']}", 
                    "%Y-%m-%d %H:%M:%S.%f"
                ) if sequence else datetime.now()
            except ValueError:
                try:
                    last_event_dt = datetime.strptime(
                        f"{sequence[-1]['date']} {sequence[-1]['time']}", 
                        "%Y-%m-%d %H:%M:%S"
                    ) if sequence else datetime.now()
                except:
                    last_event_dt = datetime.now()

            duration_sec = (last_event_dt - start_dt).total_seconds()
            # Exigence: Additionner les durées pour la même activité
            if activity in activity_durations:
                activity_durations[activity] += duration_sec
            else:
                activity_durations[activity] = duration_sec

        # Update global active activities for the next segment
        global_active_activities = active_activities.copy()

        # Exigence: Déterminer la classe majoritaire en fonction de la durée de chaque activité
        if activity_durations:
            majority_activity = max(activity_durations.items(), key=lambda x: x[1])[0]
        else:
            majority_activity = last_majority_activity or "None"

        if majority_activity == "None" and last_majority_activity:
            majority_activity = last_majority_activity
        last_majority_activity = majority_activity

        # Extract time features for start and end times
        start_features = extract_time_features(start_time, "start_")
        end_features = extract_time_features(end_time, "end_")

        # Count sensors activations - CORRECTION: Count both "ON" and "OPEN" states
        sensor_counts = [sum(1 for e in sequence if e["sensor"] == s and (e["state"] == "ON" or e["state"] == "OPEN")) for s in all_sensors]

        # Create feature vector with time features, duration, and sensor counts
        feature_vector = (
            [start_features[name] for name in start_time_feature_names] +
            [end_features[name] for name in end_time_feature_names] +
            [sequence_duration_norm] +  # Using sequence duration
            sensor_counts
        )

        X.append(feature_vector)
        y.append(majority_activity)

        # Move to the next segment
        current_idx = end_idx + 1

    return np.array(X, dtype=np.float32), np.array(y)

def save_dataset_to_file(X, y, filename="dataset_output.txt"):
    """
    Save the dataset to a readable text file, with named features for easy inspection.
    """
    # Build the correct list of feature names based on create_dataset output
    feature_names = []
    
    # Time features for start (10 features)
    start_features = [
        'start_hour_sin', 'start_hour_cos', 
        'start_minute_sin', 'start_minute_cos', 
        'start_day_sin', 'start_day_cos', 
        'start_month_sin', 'start_month_cos', 
        'start_day_of_week_sin', 'start_day_of_week_cos'
    ]
    # Time features for end (10 features)
    end_features = [
        'end_hour_sin', 'end_hour_cos', 
        'end_minute_sin', 'end_minute_cos', 
        'end_day_sin', 'end_day_cos', 
        'end_month_sin', 'end_month_cos', 
        'end_day_of_week_sin', 'end_day_of_week_cos'
    ]
    feature_names.extend(start_features)
    feature_names.extend(end_features)
    
    # Duration feature (1 feature)
    feature_names.append("activity_duration_normalized")
    
    # Sensor features (34 features)
    for i in range(1, 32):
        feature_names.append(f"M{i:03d}")
    feature_names.extend(["D001", "D003", "D004"])
    
    with open(filename, 'w') as f:
        for i in range(len(X)):
            f.write(f"X[{i}]: [\n")
            
            # Write time features (20 features)
            f.write("    # Time Features (20 features: 10 for start date, 10 for end date)\n")
            for j in range(20):
                f.write(f"    '{feature_names[j]}': {X[i][j]},\n")
            
            # Write duration feature
            duration_idx = 20
            f.write(f"    '{feature_names[duration_idx]}': {X[i][duration_idx]},  # Normalized activity duration\n")
            
            # Write sensor features (remaining 34 features)
            f.write("    # Sensor Features (34 features)\n")
            for j in range(duration_idx + 1, len(feature_names)):
                f.write(f"    '{feature_names[j]}': {X[i][j]}")
                if j < len(feature_names) - 1:
                    f.write(",\n")
                else:
                    f.write("\n")
            
            f.write("]\n")
            f.write(f"y[{i}]: '{y[i]}'\n")
            f.write("_" * 50 + "\n\n")