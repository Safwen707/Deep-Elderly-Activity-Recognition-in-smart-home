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
    
    hour = dt.hour
    minute = dt.minute
    second = dt.second
    day = dt.day
    month = dt.month
    day_of_week = dt.weekday()  # 0-6 (Monday to Sunday)
    
    # Calculate total time in seconds for the day (0-86399)
    time_of_day = hour * 3600 + minute * 60 + second
    
    hour_sin, hour_cos = encode_cyclical_feature(hour, 24)
    minute_sin, minute_cos = encode_cyclical_feature(minute, 60)
    second_sin, second_cos = encode_cyclical_feature(second, 60)
    day_sin, day_cos = encode_cyclical_feature(day, 31)  # Using 31 as max days in month
    month_sin, month_cos = encode_cyclical_feature(month, 12)
    day_of_week_sin, day_of_week_cos = encode_cyclical_feature(day_of_week, 7)
    time_of_day_sin, time_of_day_cos = encode_cyclical_feature(time_of_day, 86400)
    
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

def get_event_datetime(event):
    """
    Safely extract a datetime object from an event.
    Returns None if either the "date" or "time" key is missing or if parsing fails.
    """
    if 'date' not in event or 'time' not in event:
        return None
    date_str = event['date']
    time_str = event['time']
    try:
        return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S.%f")
    except ValueError:
        try:
            return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None

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

    global_active_activities = {}  # Format: {activity: (start_idx, start_dt)}
    last_majority_activity = None

    # Feature names for time features
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

    current_idx = 0

    while current_idx < len(data):
        # Get start time of the segment; skip if missing/unparsable
        start_time = get_event_datetime(data[current_idx])
        if start_time is None:
            current_idx += 1
            continue

        sequence_start_idx = current_idx

        # Check the next event's time if available
        next_idx = current_idx + 1
        next_time = None
        if next_idx < len(data):
            next_time = get_event_datetime(data[next_idx])

        # If the time difference exceeds target + tolerance, skip this event
        if next_time and (next_time - start_time).total_seconds() > (target_duration_seconds + tolerance_seconds):
            current_idx += 1
            continue

        target_end_time = start_time + timedelta(seconds=target_duration_seconds)
        min_end_time = target_end_time - timedelta(seconds=tolerance_seconds)
        max_end_time = target_end_time + timedelta(seconds=tolerance_seconds)

        end_idx = current_idx + 1
        end_time = None

        # Search for an event to mark the segment's end
        while end_idx < len(data) and end_idx < current_idx + 1000:  # Safety limit
            event_time = get_event_datetime(data[end_idx])
            if event_time is None:
                end_idx += 1
                continue

            # Check the time difference with the previous event
            prev_idx = end_idx - 1
            prev_time = None
            if prev_idx >= current_idx:
                prev_time = get_event_datetime(data[prev_idx])
            if prev_time and (event_time - prev_time).total_seconds() > (target_duration_seconds + tolerance_seconds):
                # End the segment at the previous event
                end_idx = prev_idx
                end_time = get_event_datetime(data[end_idx])
                if end_time is None:
                    end_time = prev_time
                break

            # If we've reached the target duration window
            if event_time >= min_end_time:
                if event_time <= max_end_time:
                    end_time = event_time
                    break
                else:
                    # If beyond the tolerance, use the previous event instead
                    end_idx -= 1
                    end_time = get_event_datetime(data[end_idx])
                    if end_time is None:
                        end_time = start_time + timedelta(seconds=target_duration_seconds)
                    break

            end_idx += 1

        # If we reach the end of the data, use the last event available
        if end_idx >= len(data):
            end_idx = len(data) - 1
            end_time = get_event_datetime(data[end_idx])
            if end_time is None:
                end_time = start_time + timedelta(seconds=target_duration_seconds)

        sequence = data[current_idx:end_idx+1]

        # Ensure the sequence has at least two valid events
        if len(sequence) < 2:
            current_idx = end_idx + 1
            continue

        # Calculate sequence duration
        if end_time:
            sequence_duration_sec = (end_time - start_time).total_seconds()
        else:
            sequence_duration_sec = target_duration_seconds

        sequence_duration_norm = max(sequence_duration_sec / 86400, 0.0001)  # normalized over a day

        active_activities = global_active_activities.copy()
        activity_durations = {}

        # Process events within the sequence to compute durations for activities
        for j, event in enumerate(sequence):
            if event.get("activity"):
                activity_parts = event["activity"].replace(" ", "").split(",")
                if len(activity_parts) != 2:
                    continue
                activity_name, action = activity_parts

                event_dt = get_event_datetime(event)
                if event_dt is None:
                    event_dt = datetime.now()  # or consider skipping the event

                if action == "begin":
                    active_activities[activity_name] = (j, event_dt)
                elif action == "end":
                    if activity_name in active_activities:
                        start_idx_inner, start_dt = active_activities[activity_name]
                        duration_sec = (event_dt - start_dt).total_seconds()
                        activity_durations[activity_name] = activity_durations.get(activity_name, 0) + duration_sec
                        del active_activities[activity_name]

        # Handle activities that started but did not finish within the segment
        for activity, (start_idx_inner, start_dt) in active_activities.items():
            last_event_dt = get_event_datetime(sequence[-1])
            if last_event_dt is None:
                last_event_dt = datetime.now()
            duration_sec = (last_event_dt - start_dt).total_seconds()
            activity_durations[activity] = activity_durations.get(activity, 0) + duration_sec

        global_active_activities = active_activities.copy()

        # Determine majority activity by duration
        if activity_durations:
            majority_activity = max(activity_durations.items(), key=lambda x: x[1])[0]
        else:
            majority_activity = last_majority_activity or "None"

        if majority_activity == "None" and last_majority_activity:
            majority_activity = last_majority_activity
        last_majority_activity = majority_activity

        start_features = extract_time_features(start_time, "start_")
        end_features = extract_time_features(end_time, "end_")

        # Count sensor activations (count states "ON" and "OPEN")
        sensor_counts = [
            sum(1 for e in sequence if e.get("sensor") == s and (e.get("state") == "ON" or e.get("state") == "OPEN"))
            for s in all_sensors
        ]

        feature_vector = (
            [start_features[name] for name in start_time_feature_names] +
            [end_features[name] for name in end_time_feature_names] +
            [sequence_duration_norm] +  # normalized duration
            sensor_counts
        )

        X.append(feature_vector)
        y.append(majority_activity)

        current_idx = end_idx + 1

    return np.array(X, dtype=np.float32), np.array(y)

def save_dataset_to_file(X, y, filename="dataset_output.txt"):
    """
    Save the dataset to a readable text file, with named features for easy inspection.
    """
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
    
    # Duration feature
    feature_names.append("activity_duration_normalized")
    
    # Sensor features (31 M-sensors and 3 additional sensors)
    for i in range(1, 32):
        feature_names.append(f"M{i:03d}")
    feature_names.extend(["D001", "D003", "D004"])
    
    with open(filename, 'w') as f:
        for i in range(len(X)):
            f.write(f"X[{i}]: [\n")
            
            f.write("    # Time Features (20 features: 10 for start date, 10 for end date)\n")
            for j in range(20):
                f.write(f"    '{feature_names[j]}': {X[i][j]},\n")
            
            duration_idx = 20
            f.write(f"    '{feature_names[duration_idx]}': {X[i][duration_idx]},  # Normalized activity duration\n")
            
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
