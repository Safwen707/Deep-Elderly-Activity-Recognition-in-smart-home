import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

const ReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get data from navigation params
  const { prediction = '', events = [] } = route.params || {};
  const [correction, setCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const saveCorrectionToFile = async () => {
    if (!correction.trim()) {
      setSubmissionError('Please enter a correction');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const timestamp = new Date().toISOString();
      const content = `${timestamp} | Prediction: ${prediction} | Correction: ${correction}\n`;
      const fileUri = FileSystem.documentDirectory + 'activity_corrections.txt';

      // Check if file exists, create if it doesn't
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(fileUri, '');
      }

      // Append new correction
      await FileSystem.writeAsStringAsync(fileUri, content, { append: true });

      // Navigate back with success
      navigation.goBack();
      Alert.alert('Success', 'Your correction has been saved!');
    } catch (error) {
      console.error('Error saving correction:', error);
      setSubmissionError('Failed to save correction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSensorEvent = (item, index) => (
      <View key={`event-${index}`} style={styles.eventItemContainer}>
        {/* Timeline indicator */}
        {index !== events.length - 1 && (
            <View style={[styles.timelineConnector, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        )}
        <View style={[styles.timelineDot, { backgroundColor: '#3498db' }]} />

        <View style={styles.eventItem}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTime, { color: '#95A5A6' }]}>
              {item.time || ''}
            </Text>
            <View style={[
              styles.eventTypeBadge,
              {
                backgroundColor: item.state === 'ON' ?
                    'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'
              }
            ]}>
              <Text style={[
                styles.eventTypeText,
                { color: item.state === 'ON' ? '#2ecc71' : '#e74c3c' }
              ]}>
                {item.state || ''}
              </Text>
            </View>
          </View>
          <Text style={[styles.eventTitle, { color: '#fff' }]}>
            Sensor: {item.sensor || ''}
          </Text>
          <Text style={[styles.eventDescription, { color: '#95A5A6' }]}>
            Date: {item.date || ''}
          </Text>

          {/* Data display */}
          <View style={[styles.dataContainer, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Text style={[styles.dataText, { color: '#fff' }]}>
              {`${item.date || ''},${item.time || ''},${item.sensor || ''},${item.state || ''}`}
            </Text>
          </View>
        </View>
      </View>
  );

  return (
      <ImageBackground
          source={require('../assets/DarkMode.png')}
          style={styles.background}
          resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#fff' }]}>Review Activity</Text>
            <View style={{ width: 24 }} /> {/* Spacer for alignment */}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Prediction Card */}
            <View style={[styles.card, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: '#fff' }]}>
                  Activity Prediction
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

              <Text style={[styles.predictionText, { color: '#fff' }]}>
                {prediction || 'No prediction available'}
              </Text>

              {/* Sensor Events */}
              <Text style={[styles.sectionTitle, { color: '#fff' }]}>
                Sensor Events ({events.length})
              </Text>

              {events.length > 0 ? (
                  <View style={styles.timelineContainer}>
                    {events.map((item, index) => renderSensorEvent(item, index))}
                  </View>
              ) : (
                  <View style={styles.noEvents}>
                    <Text style={[styles.noEventsText, { color: '#95A5A6' }]}>
                      No sensor events available
                    </Text>
                  </View>
              )}
            </View>

            {/* Correction Form */}
            <View style={[styles.card, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
              <Text style={[styles.sectionTitle, { color: '#fff' }]}>
                Correct This Activity
              </Text>
              <Text style={[styles.description, { color: '#95A5A6' }]}>
                If the system misidentified this activity, please provide the correct activity below:
              </Text>

              <TextInput
                  placeholder="Enter the correct activity..."
                  placeholderTextColor="#95A5A6"
                  value={correction}
                  onChangeText={setCorrection}
                  style={[
                    styles.input,
                    {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.1)'
                    }
                  ]}
                  multiline
              />

              {submissionError ? (
                  <Text style={[styles.errorText, { color: '#e74c3c' }]}>{submissionError}</Text>
              ) : null}

              <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: '#3498db' },
                    isSubmitting && styles.saveButtonDisabled
                  ]}
                  onPress={saveCorrectionToFile}
                  disabled={isSubmitting}
              >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                      <MaterialIcons name="save" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Submit Correction</Text>
                    </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  predictionText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 12,
    marginBottom: 10,
  },
  eventItemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingLeft: 10,
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 24,
    bottom: -15,
    width: 2,
    zIndex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    left: 10,
    top: 18,
    zIndex: 2,
  },
  eventItem: {
    flex: 1,
    marginLeft: 20,
    padding: 15,
    borderRadius: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  dataContainer: {
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  noEvents: {
    padding: 15,
    alignItems: 'center',
  },
  noEventsText: {
    fontStyle: 'italic',
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ReviewScreen;