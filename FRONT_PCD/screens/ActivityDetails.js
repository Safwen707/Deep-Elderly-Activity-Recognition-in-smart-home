import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';

export default function ActivityDetailsScreen({ navigation, route }) {
  const getF1_ScoreColor = (F1_Score) => {
    const F1_ScoreValue = parseFloat(F1_Score);
    if (F1_ScoreValue >= 0.8) return "#2ecc71"; 
    if (F1_ScoreValue >= 0.5) return "#f1c40f"; 
    return "#e74c3c"; 
  };

  const formatF1_Score = (F1_Score) => {
    if (typeof F1_Score === 'string' && F1_Score.includes('%')) return F1_Score;
    return `${(parseFloat(F1_Score) * 100).toFixed(1)}%`;
  };
  const reviewsHandler = () => {
    // Make sure we're correctly accessing and passing the currentBatch from route params
    const eventsData = route.params.currentBatch;
    
    console.log('Passing to ReviewScreen:', {
      prediction: route.params.prediction,
      events: eventsData
    });
    
    navigation.navigate('ReviewScreen', {
      prediction: route.params.prediction,
      events: eventsData
    });
  };
  
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="leftcircle" size={32} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.title}>Activity Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Activity Header */}
          <View style={styles.activityHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#e8f4fc' }]}>
              <MaterialCommunityIcons 
                name="walk" 
                size={40} 
                color="#2980b9" 
              />
            </View>
            <Text style={styles.activityTitle}>{route.params.prediction}</Text>
          </View>

          {/* Confidence Badge */}
          <View style={[styles.F1_ScoreBadge, { backgroundColor: getF1_ScoreColor(route.params.F1_Score) }]}>
            <Ionicons name="stats-chart" size={18} color="white" />
            <Text style={styles.F1_ScoreBadgeText}>
              F1 Score: {formatF1_Score(route.params.F1_Score)}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={28} color="#7f8c8d" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>June 12, 2024</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Feather name="clock" size={28} color="#7f8c8d" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>3:30 PM - 4:45 PM</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <FontAwesome name="history" size={28} color="#7f8c8d" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>1h 15min</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.actionTitle}>Validate this activity?</Text>
            <Text style={styles.actionSubtitle}>
              Help us improve our system by confirming this detection
            </Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => console.log('Confirmed')}
              >
                <AntDesign name="checkcircle" size={24} color="white" />
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.denyButton]}
                onPress={reviewsHandler}
              >
                <AntDesign name="closecircle" size={24} color="white" />
                <Text style={styles.buttonText}>Correct</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'Helvetica',
  },
  container: {
    padding: 20,
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    padding: 15,
    borderRadius: 15,
    marginRight: 20,
  },
  activityTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    flexShrink: 1,
  },
  F1_ScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 25,
  },
  F1_ScoreBadgeText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 25,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailText: {
    marginLeft: 20,
  },
  detailLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 18,
    color: '#34495e',
    fontWeight: '500',
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 25,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  actionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24,
    marginBottom: 25,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#27ae60',
  },
  denyButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 10,
  },
});
