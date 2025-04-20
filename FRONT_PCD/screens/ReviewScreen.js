import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

export default function ReviewScreen({ navigation, route }) {
  const { prediction, events } = route.params || {};
  const [correctLabel, setCorrectLabel] = React.useState('');
  
  // Log the events to debug
  console.log('Events received in ReviewScreen:', events);

  // Render each sensor event as a CSV row
  const renderSensorEvent = (item, index) => (
    <View key={`sensor-event-${index}`} style={styles.eventItemContainer}>
      {/* Timeline connector line */}
      {index !== (events ? events.length - 1 : 0) && (
        <View style={styles.timelineConnector} />
      )}
      
      {/* Event dot */}
      <View style={styles.timelineDot} />
      
      {/* Event content */}
      <View style={styles.eventItem}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTime}>{item.time}</Text>
          <View style={[styles.eventTypeBadge, 
            { backgroundColor: item.state === 'ON' ? '#2ecc71' : '#e74c3c' }]}>
            <Text style={styles.eventTypeText}>{item.state}</Text>
          </View>
        </View>
        <Text style={styles.eventTitle}>Sensor: {item.sensor}</Text>
        <Text style={styles.eventDescription}>Date: {item.date}</Text>
        {item.activity && <Text style={styles.eventValue}>Activity: {item.activity}</Text>}
        
        {/* CSV Format Display */}
        <View style={styles.csvContainer}>
          <Text style={styles.csvText}>
            {`${item.date},${item.time},${item.sensor},${item.state},${item.activity || ''}`}
          </Text>
        </View>
      </View>
    </View>
  );

  const saveCorrectionToFile = async () => {
    const timestamp = new Date().toISOString();
    const content = `${timestamp || 'N/A'} | Prediction: ${prediction} | Correct: ${correctLabel}\n`;
    const fileUri = FileSystem.documentDirectory + 'corrections.txt';
    try {
      await FileSystem.writeAsStringAsync(fileUri, content, { append: true });
      alert('Correction saved!');
      navigation.goBack();
    } catch (err) {
      console.error('Error writing to file:', err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="leftcircle" size={32} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="brain" size={40} color="#2980b9" style={styles.icon} />
            <Text style={styles.prediction}>{prediction}</Text>
          </View>

          <View style={styles.divider} />
          
          {/* CSV Header */}
          <View style={styles.csvHeaderContainer}>
            <Text style={styles.csvHeaderText}>date,time,sensor,state,activity</Text>
          </View>
          
          {events && Array.isArray(events) && events.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>Sensor Events Data</Text>
              <View style={styles.timelineContainer}>
                {events.map((item, index) => renderSensorEvent(item, index))}
              </View>
              <View style={styles.divider} />
            </View>
          ) : (
            <View>
              <Text style={styles.noEventsText}>No events data available</Text>
              <Text style={styles.debugText}>
                Please check that the 'events' parameter is being passed correctly.
                Data received: {JSON.stringify(events)}
              </Text>
              <View style={styles.divider} />
            </View>
          )}

          <Text style={styles.description}>
            This screen shows the sensor data that was analyzed. You can correct the activity label below:
          </Text>

          <TextInput
            placeholder="Write the correct activity..."
            value={correctLabel}
            onChangeText={setCorrectLabel}
            style={styles.input}
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveCorrectionToFile}>
            <AntDesign name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Correction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    borderBottomWidth: 1, borderBottomColor: '#ecf0f1', backgroundColor: '#ffffff'
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#2c3e50' },
  content: { padding: 20 },
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 3
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  icon: { marginRight: 15 },
  prediction: { fontSize: 24, fontWeight: '600', color: '#34495e' },
  divider: { height: 1, backgroundColor: '#ecf0f1', marginVertical: 20 },
  description: { fontSize: 15, color: '#7f8c8d', lineHeight: 22, marginBottom: 15 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    padding: 12, marginBottom: 20, fontSize: 16
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3498db', paddingVertical: 12, borderRadius: 10
  },
  saveButtonText: { color: '#fff', marginLeft: 10, fontSize: 16, fontWeight: '600' },
  
  // Timeline and events styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2c3e50'
  },
  timelineContainer: {
    paddingLeft: 12,
    position: 'relative'
  },
  eventItemContainer: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 15,
    paddingLeft: 10
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
    position: 'absolute',
    left: 0,
    top: 20,
    zIndex: 2
  },
  timelineConnector: {
    position: 'absolute',
    left: 5,
    top: 26,
    bottom: -15,
    width: 2,
    backgroundColor: '#bdc3c7',
    zIndex: 1
  },
  eventItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginLeft: 20
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  eventTime: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  eventTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5
  },
  eventDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  eventValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 5
  },
  noEventsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontStyle: 'italic',
    padding: 10
  },
  debugText: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 12,
    padding: 10,
    backgroundColor: '#fadbd8',
    borderRadius: 5,
    marginVertical: 10
  },
  csvContainer: {
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    padding: 10,
    marginTop: 10
  },
  csvText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#2d3748'
  },
  csvHeaderContainer: {
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15
  },
  csvHeaderText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold'
  }
});