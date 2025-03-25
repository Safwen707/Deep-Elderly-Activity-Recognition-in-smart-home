import json
from datetime import datetime
import numpy as np
import sys

# Function to parse datetime with flexible format
def parse_datetime(date_str, time_str):
    # Try with microseconds format first
    full_str = f"{date_str} {time_str}"
    try:
        return datetime.strptime(full_str, '%Y-%m-%d %H:%M:%S.%f')
    except ValueError:
        # If that fails, try without microseconds
        try:
            return datetime.strptime(full_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            # Print the problematic value for debugging
            print(f"ERROR: Could not parse datetime: '{full_str}'")
            raise

# Function to analyze time differences with progress reporting
def analyze_time_differences(file_path):
    print(f"Starting analysis of file: {file_path}")
    
    # Load JSON data
    try:
        print("Loading JSON data...")
        with open(file_path, 'r') as f:
            data = json.load(f)
        print(f"Successfully loaded {len(data)} records")
    except FileNotFoundError:
        print(f"ERROR: File {file_path} not found")
        return {"error": f"File {file_path} not found"}
    except json.JSONDecodeError:
        print(f"ERROR: File {file_path} contains invalid JSON")
        return {"error": f"File {file_path} contains invalid JSON"}
    
    # Calculate time differences
    print("\nCalculating time differences...")
    time_diffs = []
    total_records = len(data)
    
    for i in range(1, total_records):
        if i % 100 == 0 or i == total_records - 1:  # Print progress every 100 records or at the end
            progress = (i / (total_records - 1)) * 100
            print(f"Processing record {i}/{total_records-1} ({progress:.1f}% complete)")
        
        try:
            prev_datetime = parse_datetime(data[i-1]['date'], data[i-1]['time'])
            curr_datetime = parse_datetime(data[i]['date'], data[i]['time'])
            diff_seconds = (curr_datetime - prev_datetime).total_seconds()
            time_diffs.append(diff_seconds)
        except Exception as e:
            print(f"WARNING: Error processing records {i-1} and {i}: {str(e)}")
            print(f"  Record {i-1}: {data[i-1]['date']} {data[i-1]['time']}")
            print(f"  Record {i}: {data[i]['date']} {data[i]['time']}")
            # Continue processing other records
            continue
    
    if not time_diffs:
        print("ERROR: No valid time differences could be calculated")
        return {"error": "No valid time differences could be calculated"}
    
    print(f"Completed calculation of {len(time_diffs)} time differences")
    
    # Determine appropriate intervals based on data distribution
    print("\nAnalyzing time difference distribution...")
    percentiles = np.percentile(time_diffs, [25, 50, 75, 90, 95, 99])
    print(f"Time difference percentiles (seconds):")
    print(f"  25th: {percentiles[0]:.2f}")
    print(f"  50th (median): {percentiles[1]:.2f}")
    print(f"  75th: {percentiles[2]:.2f}")
    print(f"  90th: {percentiles[3]:.2f}")
    print(f"  95th: {percentiles[4]:.2f}")
    print(f"  99th: {percentiles[5]:.2f}")
    
    # Create interval boundaries
    interval_bounds = [0, 1, 5, 10, 30, 60, 300, 600, 1800, 3600, float('inf')]
    interval_names = [
        "Less than 1 second",
        "1-5 seconds",
        "5-10 seconds",
        "10-30 seconds",
        "30-60 seconds",
        "1-5 minutes",
        "5-10 minutes",
        "10-30 minutes",
        "30-60 minutes",
        "More than 1 hour"
    ]
    
    print("\nGrouping time differences into intervals...")
    # Group differences into intervals
    interval_counts = [0] * len(interval_names)
    for diff in time_diffs:
        for i in range(len(interval_bounds) - 1):
            if interval_bounds[i] <= diff < interval_bounds[i+1]:
                interval_counts[i] += 1
                break
    
    # Calculate percentages
    total_diffs = len(time_diffs)
    interval_percentages = [count / total_diffs * 100 for count in interval_counts]
    
    # Create results dictionary
    print("\nCreating final results...")
    results = {
        "total_entries": len(data),
        "total_time_differences": total_diffs,
        "basic_statistics": {
            "min_diff": min(time_diffs),
            "max_diff": max(time_diffs),
            "mean_diff": np.mean(time_diffs),
            "median_diff": np.median(time_diffs)
        },
        "intervals": []
    }
    
    for i in range(len(interval_names)):
        if interval_counts[i] > 0:
            results["intervals"].append({
                "interval": interval_names[i],
                "lower_bound": interval_bounds[i],
                "upper_bound": interval_bounds[i+1] if interval_bounds[i+1] != float('inf') else "infinity",
                "count": interval_counts[i],
                "percentage": round(interval_percentages[i], 2)
            })
    
    print("Analysis completed successfully")
    return results

# Run the analysis on the correct file
file_path = 'M_and_D_sensors_labeled.json'
print("="*60)
print(f"SENSOR DATA TIME DIFFERENCE ANALYSIS")
print("="*60)
print(f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Target file: {file_path}")
print("-"*60)

try:
    results = analyze_time_differences(file_path)

    # Write results to output file
    output_file = 'time_difference_analysis.json'
    print(f"\nWriting results to {output_file}...")
    with open(output_file, 'w') as outfile:
        json.dump(results, outfile, indent=4)
    print(f"Results successfully written to {output_file}")

    # Print summary
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY")
    print("="*60)
    if "error" in results:
        print(f"Error: {results['error']}")
    else:
        print(f"Total entries analyzed: {results['total_entries']}")
        print(f"Time differences calculated: {results['total_time_differences']}")
        print("\nBasic statistics (in seconds):")
        print(f"  Minimum time difference: {results['basic_statistics']['min_diff']:.2f}")
        print(f"  Maximum time difference: {results['basic_statistics']['max_diff']:.2f}")
        print(f"  Mean time difference: {results['basic_statistics']['mean_diff']:.2f}")
        print(f"  Median time difference: {results['basic_statistics']['median_diff']:.2f}")
        
        print("\nTime difference distribution:")
        for interval in results["intervals"]:
            print(f"  {interval['interval']}: {interval['count']} ({interval['percentage']}%)")

    print("\nAnalysis complete!")
except Exception as e:
    print(f"\nERROR: Script failed with exception: {str(e)}")
    print("\nStacktrace:")
    import traceback
    traceback.print_exc()