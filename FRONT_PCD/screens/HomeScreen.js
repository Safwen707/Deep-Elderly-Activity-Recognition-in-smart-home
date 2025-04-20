// src/screens/DashBoardScreen.js
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Button from '../components/common/Button';
import sensorLocations from '../data/sonsorsLocalisation.json';
import sampleCSVData from '../data/M_and_D_sensors_labeled_AllSensors.json';

export default function HomeScreen({ navigation }) {
  const today = new Date().toDateString();
  
  const [sensorLogs, setSensorLogs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingData, setProcessingData] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  // Keep track of the current batch data
  const [currentBatchData, setCurrentBatchData] = useState(null);
  // Stage determines what we're showing: 1=sensor logs, 2=AI results
  const [displayStage, setDisplayStage] = useState(0);
  
  const BATCH_SIZE = 5;

  // Function to get room location for a sensor
  const getSensorLocation = (sensorId) => {
    for (const [room, data] of Object.entries(sensorLocations[0])) {
      if (data.sensors.includes(sensorId)) {
        return room;
      }
    }
    return "Unknown Location";
  };

  // Function to format the sensor log message into a readable string
  const formatSensorMessage = (log) => {
    const room = getSensorLocation(log.sensor);
    const stateText = log.state === "ON" ? "activated" : "deactivated";
    return `Sensor ${log.sensor} is ${stateText} at ${log.time} in ${room}`;
  };

  // Parse timestamp from the data
  const parseTimestamp = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes, seconds] = timeStr.split(':');
    const [secs, msecs] = seconds.split('.');
    
    const date = new Date(year, month - 1, day, 
                          parseInt(hours), 
                          parseInt(minutes), 
                          parseInt(secs),
                          parseInt(msecs ? msecs.substring(0, 3) : 0));
    return date;
  };

  // Calculate delay in milliseconds between two timestamps
  const calculateDelay = (currentLog, nextLog) => {
    if (!nextLog) return 1000;
    
    const currentTime = parseTimestamp(currentLog.date, currentLog.time);
    const nextTime = parseTimestamp(nextLog.date, nextLog.time);
    
    const diffMs = nextTime - currentTime;
    
    // Cap the delay to be reasonable for UI
    if (diffMs < 500) return 500;
    if (diffMs > 5000) return 5000;
    return diffMs;
  };

  // Mock AI model function a remplacer par datavalidation output.txt
  const processWithAIModel = (batchData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Processing batch with AI model:', batchData);
        
        const result = {
          timestamp: new Date().toLocaleTimeString(),
          prediction: `Activity detected: ${batchData.length > 0 && batchData[0].sensor.includes('M00') ? 'Bedroom activity' : 'Other room activity'}`,
          F1_Score: Math.floor(Math.random() * 30 + 70) + '%',
          // Store the current batch with the result
          currentBatch: batchData
        };
        
        resolve(result);
      }, 1000);
    });
  };



  // Function to process a batch of sensor data
  const processBatch = async (startIndex) => {
    if (startIndex >= sampleCSVData.length) return;
    
    setProcessingData(true);
    // Stage 1: Display sensor logs
    setDisplayStage(1);
    
    // Clear previous sensor logs
    setSensorLogs([]);
    
    // Determine batch end
    const endIndex = Math.min(startIndex + BATCH_SIZE, sampleCSVData.length);
    const currentBatch = sampleCSVData.slice(startIndex, endIndex);
    
    // Save the current batch
    setCurrentBatchData(currentBatch);
    
    // Display each log in the batch with real time intervals
    for (let i = 0; i < currentBatch.length; i++) {
      const log = currentBatch[i];
      const nextLog = currentBatch[i + 1];
      
      setSensorLogs(prevLogs => [...prevLogs, formatSensorMessage(log)]);
      
      if (i < currentBatch.length - 1) {
        const delay = calculateDelay(log, nextLog);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Wait a moment to let the user see all events
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Process with AI
    const aiResult = await processWithAIModel(currentBatch);
    
    // Stage 2: Display AI results
    setDisplayStage(2);
    
    // Update AI results
    setAiResults(prevResults => [...prevResults, aiResult]);
    
    // Wait to let the user see the AI result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setProcessingData(false);
    
    // Move to the next batch
    if (endIndex < sampleCSVData.length) {
      setCurrentIndex(endIndex);
    }
  };

  useEffect(() => {
    if (!processingData) {
      processBatch(currentIndex);
    }
  }, [currentIndex, processingData]);

  // Navigate to history screen with AI results
  const goToHistorique = () => {
    navigation.navigate('Historique', { aiResults });
  };
  
  // Navigate to details screen with both AI result and current batch data
  const goToDetails = () => {
    const latestResult = aiResults[aiResults.length - 1];
    
    navigation.navigate('Details', { 
      ...latestResult
      // currentBatch is already included in latestResult via the processWithAIModel function
    });
  };

  // Header component for the main FlatList
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="leftcircle" size={32} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.title}> Activitées Courantes</Text>
      </View>
      
      <Text style={styles.subtitle}>Track your daily activities effortlessly.</Text>
      
      {/* Sensor Logs Card - Only shown during Stage 1 */}
      {displayStage === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Sensor Feeds</Text>
          <Text style={styles.date}>{today}</Text>
          
          {sensorLogs.length > 0 ? (
            sensorLogs.map((log, index) => (
              <Text key={`manual-log-${index}`} style={styles.logItem}>{log}</Text>
            ))
          ) : (
            <Text style={styles.noDataText}>Loading sensor data...</Text>
          )}
        </View>
      )}
      
      {/* AI Analysis Card - Only shown during Stage 2 */}
      {displayStage === 2 && aiResults.length > 0 && (
        <View style={styles.aiCard}>
          <Text style={styles.cardTitle}>AI Analysis</Text>
          
          <View style={styles.aiResult}>
            <Text style={styles.aiTimestamp}>{aiResults[aiResults.length-1].timestamp}</Text>
            <Text style={styles.aiPrediction}>{aiResults[aiResults.length-1].prediction}</Text>
            <Text style={styles.aiF1_Score}>F1_Score: {aiResults[aiResults.length-1].F1_Score}</Text>
          </View>
        </View>
      )}
      
      {/* Status Card - Always shown */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Processing Status</Text>
        <Text style={styles.statusText}>
          {displayStage === 0 ? "Starting up..." : 
           displayStage === 1 ? "Monitoring sensor events..." : 
           "Analyzing activity patterns..."}
        </Text>
        <Text style={styles.progressText}>
          Processed {Math.min(currentIndex, sampleCSVData.length)} of {sampleCSVData.length} events
        </Text>
      </View>
      
      {/* Current Activity Card - Now shows only most recent result */}
      {aiResults.length > 0 && (
        <TouchableOpacity onPress={goToDetails}>
          <View style={styles.currentActivityCard}>
            <Text style={styles.cardTitle}>Current Activity : View Details</Text>
            <View style={styles.historyItem}>
              <Text style={styles.aiTimestamp}>{aiResults[aiResults.length-1].timestamp}</Text>
              <Text style={styles.historyPrediction}>{aiResults[aiResults.length-1].prediction}</Text>
              <Text style={styles.historyF1_Score}>F1 score: {aiResults[aiResults.length-1].F1_Score}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </>
  );

  // Footer component for the main FlatList
  const renderFooter = () => (
    <View style={styles.buttonContainer}>
      <Button title="View Historic" onPress={goToHistorique} />
    </View>
  );

  return (
    // Using FlatList as the main scrollable container with empty data
    // But utilizing ListHeaderComponent and ListFooterComponent to display content
    <FlatList
      data={[]} // Empty data array since we're just using header and footer
      renderItem={null}
      keyExtractor={() => "key"}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 15,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  aiCard: {
    width: '100%',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  currentActivityCard: {
    width: '100%',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4FC3F7',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  logItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    marginBottom: 10,
  },
  aiResult: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  aiTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  aiPrediction: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#2196F3',
  },
  aiF1_Score: {
    fontSize: 13,
    color: '#444',
  },
  historyItem: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#9E9E9E',
  },
  historyPrediction: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
    color: '#555',
  },
  historyF1_Score: {
    fontSize: 12,
    color: '#777',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 10,
  }
});