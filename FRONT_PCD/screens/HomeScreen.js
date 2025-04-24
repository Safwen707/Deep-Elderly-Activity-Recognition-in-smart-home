import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { ArrowLeftIcon, UserIcon } from 'react-native-heroicons/solid';
import { useDynamicStyles } from '../hooks/useDynamicStyles';
import Button from '../components/Button';
import sensorLocations from '../data/sonsorsLocalisation.json';
import sampleCSVData from '../data/M_and_D_sensors_labeled_AllSensors.json';

export default function HomeScreen({ navigation }) {
  const { styles, backgroundImage, colors } = useDynamicStyles();
  const today = new Date().toDateString();

  // Keep all original state
  const [sensorLogs, setSensorLogs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingData, setProcessingData] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [currentBatchData, setCurrentBatchData] = useState(null);
  const [displayStage, setDisplayStage] = useState(0);

  const BATCH_SIZE = 5;

  // Keep all original helper functions
  const getSensorLocation = (sensorId) => {
    for (const [room, data] of Object.entries(sensorLocations[0])) {
      if (data.sensors.includes(sensorId)) {
        return room;
      }
    }
    return "Unknown Location";
  };

  const formatSensorMessage = (log) => {
    const room = getSensorLocation(log.sensor);
    const stateText = log.state === "ON" ? "activated" : "deactivated";
    return `Sensor ${log.sensor} is ${stateText} at ${log.time} in ${room}`;
  };

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

  const calculateDelay = (currentLog, nextLog) => {
    if (!nextLog) return 1000;

    const currentTime = parseTimestamp(currentLog.date, currentLog.time);
    const nextTime = parseTimestamp(nextLog.date, nextLog.time);

    const diffMs = nextTime - currentTime;

    if (diffMs < 500) return 500;
    if (diffMs > 5000) return 5000;
    return diffMs;
  };

  const processWithAIModel = (batchData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = {
          timestamp: new Date().toLocaleTimeString(),
          prediction: `Activity detected: ${batchData.length > 0 && batchData[0].sensor.includes('M00') ? 'Bedroom activity' : 'Other room activity'}`,
          F1_Score: Math.floor(Math.random() * 30 + 70) + '%',
          currentBatch: batchData
        };
        resolve(result);
      }, 1000);
    });
  };

  const processBatch = async (startIndex) => {
    if (startIndex >= sampleCSVData.length) return;

    setProcessingData(true);
    setDisplayStage(1);
    setSensorLogs([]);

    const endIndex = Math.min(startIndex + BATCH_SIZE, sampleCSVData.length);
    const currentBatch = sampleCSVData.slice(startIndex, endIndex);

    setCurrentBatchData(currentBatch);

    for (let i = 0; i < currentBatch.length; i++) {
      const log = currentBatch[i];
      const nextLog = currentBatch[i + 1];

      setSensorLogs(prevLogs => [...prevLogs, formatSensorMessage(log)]);

      if (i < currentBatch.length - 1) {
        const delay = calculateDelay(log, nextLog);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiResult = await processWithAIModel(currentBatch);
    setDisplayStage(2);
    setAiResults(prevResults => [...prevResults, aiResult]);
    await new Promise(resolve => setTimeout(resolve, 3000));

    setProcessingData(false);

    if (endIndex < sampleCSVData.length) {
      setCurrentIndex(endIndex);
    }
  };

  useEffect(() => {
    if (!processingData) {
      processBatch(currentIndex);
    }
  }, [currentIndex, processingData]);

  const goToHistorique = () => {
    navigation.navigate('Historique', { aiResults });
  };

  const goToDetails = () => {
    const latestResult = aiResults[aiResults.length - 1];
    navigation.navigate('Details', {
      ...latestResult
    });
  };

  return (
      <ImageBackground
          source={require('../assets/DarkMode.png')}
          style={localStyles.background}
          resizeMode="cover"
      >
        <SafeAreaView style={localStyles.safeArea}>
          {/* Header */}
          <View style={[localStyles.header, { backgroundColor: 'rgba(30, 30, 30, 0.7)' }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeftIcon size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={localStyles.headerTitle}>Activity Monitor</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <UserIcon size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={localStyles.content}>
            {/* Live Sensor Feeds */}
            {displayStage === 1 && (
                <View style={[localStyles.card, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
                  <Text style={[localStyles.cardTitle, { color: '#fff' }]}>Live Sensor Feeds</Text>
                  <Text style={[localStyles.date, { color: '#95A5A6' }]}>{today}</Text>
                  {sensorLogs.length > 0 ? (
                      sensorLogs.map((log, index) => (
                          <View key={`log-${index}`} style={localStyles.logItem}>
                            <View style={[
                              localStyles.logBullet,
                              { backgroundColor: log.includes('activated') ? '#2ECC71' : '#E74C3C' }
                            ]} />
                            <Text style={[localStyles.logText, { color: '#fff' }]}>{log}</Text>
                          </View>
                      ))
                  ) : (
                      <Text style={[localStyles.noDataText, { color: '#95A5A6' }]}>
                        Loading sensor data...
                      </Text>
                  )}
                </View>
            )}

            {/* AI Analysis */}
            {displayStage === 2 && aiResults.length > 0 && (
                <View style={[localStyles.card, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
                  <Text style={[localStyles.cardTitle, { color: '#fff' }]}>AI Analysis</Text>
                  <View style={localStyles.aiResult}>
                    <Text style={[localStyles.aiTimestamp, { color: '#95A5A6' }]}>
                      {aiResults[aiResults.length-1].timestamp}
                    </Text>
                    <Text style={[localStyles.aiPrediction, { color: '#4FC3F7' }]}>
                      {aiResults[aiResults.length-1].prediction}
                    </Text>
                    <Text style={[localStyles.aiF1_Score, { color: '#F1C40F' }]}>
                      F1_Score: {aiResults[aiResults.length-1].F1_Score}
                    </Text>
                  </View>
                </View>
            )}

            {/* Processing Status */}
            <View style={[localStyles.card, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
              <Text style={[localStyles.cardTitle, { color: '#fff' }]}>Processing Status</Text>
              <Text style={[localStyles.statusText, { color: '#fff' }]}>
                {displayStage === 0 ? "Starting up..." :
                    displayStage === 1 ? "Monitoring sensor events..." :
                        "Analyzing activity patterns..."}
              </Text>
              <Text style={[localStyles.progressText, { color: '#95A5A6' }]}>
                Processed {Math.min(currentIndex, sampleCSVData.length)} of {sampleCSVData.length} events
              </Text>
            </View>

            {/* Current Activity */}
            {aiResults.length > 0 && (
                <TouchableOpacity onPress={goToDetails}>
                  <View style={[localStyles.card, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
                    <Text style={[localStyles.cardTitle, { color: '#fff' }]}>Current Activity</Text>
                    <View style={localStyles.historyItem}>
                      <Text style={[localStyles.aiTimestamp, { color: '#95A5A6' }]}>
                        {aiResults[aiResults.length-1].timestamp}
                      </Text>
                      <Text style={[localStyles.historyPrediction, { color: '#fff' }]}>
                        {aiResults[aiResults.length-1].prediction}
                      </Text>
                      <Text style={[localStyles.historyF1_Score, { color: '#95A5A6' }]}>
                        F1 score: {aiResults[aiResults.length-1].F1_Score}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
            )}

            {/* View Historic Button */}
            <View style={localStyles.buttonContainer}>
              <Button
                  title="View Historic"
                  onPress={goToHistorique}
                  style={{ backgroundColor: '#3498DB' }}
                  textStyle={{ color: '#fff' }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
  );
}

const localStyles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    marginBottom: 16,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  logText: {
    fontSize: 14,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  aiResult: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  aiTimestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
  aiPrediction: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiF1_Score: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  historyPrediction: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  historyF1_Score: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: 16,
  },
});