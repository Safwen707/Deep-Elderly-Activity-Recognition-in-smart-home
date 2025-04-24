import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ImageBackground } from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';

export default function ActivityDetailsScreen({ navigation, route }) {
  const getF1_ScoreColor = (F1_Score) => {
    const F1_ScoreValue = parseFloat(F1_Score);
    if (F1_ScoreValue >= 0.8) return "#2ecc71";
    if (F1_ScoreValue >= 0.5) return "#f1c40f";
    return "#e74c3c";
  };

  const goToDashboard = () => {
    navigation.navigate('DashboardScreen', {
      prediction: route.params.prediction,
      F1_Score: route.params.F1_Score,
      currentBatch: route.params.currentBatch,
    });
  };

  const formatF1_Score = (F1_Score) => {
    if (typeof F1_Score === 'string' && F1_Score.includes('%')) return F1_Score;
    return `${(parseFloat(F1_Score) * 100).toFixed(1)}%`;
  };

  const reviewsHandler = () => {
    const eventsData = route.params.currentBatch;
    navigation.navigate('ReviewScreen', {
      prediction: route.params.prediction,
      events: eventsData
    });
  };

  return (
      <ImageBackground
          source={require('../assets/DarkMode.png')}
          style={styles.background}
      >
        <StatusBar barStyle="light-content" />

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
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                <MaterialCommunityIcons
                    name="walk"
                    size={40}
                    color="#3498db"
                />
              </View>
              <Text style={styles.activityTitle}>{route.params.prediction}</Text>
            </View>

            {/* Confidence Badge */}
            <View style={styles.badgeAndButtonRow}>
              <View style={[styles.F1_ScoreBadge, { backgroundColor: getF1_ScoreColor(route.params.F1_Score) }]}>
                <Ionicons name="stats-chart" size={18} color="white" />
                <Text style={styles.F1_ScoreBadgeText}>
                  F1 Score: {formatF1_Score(route.params.F1_Score)}
                </Text>
              </View>

              <TouchableOpacity
                  style={styles.moreDetailsButton}
                  onPress={goToDashboard}
              >
                <Text style={styles.moreDetailsText}>More Details</Text>
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Feather name="calendar" size={28} color="#95A5A6" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>June 12, 2024</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Feather name="clock" size={28} color="#95A5A6" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>3:30 PM - 4:45 PM</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <FontAwesome name="history" size={28} color="#95A5A6" />
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
      </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  mainCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.85)',
    borderRadius: 16,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
    flexShrink: 1,
  },
  F1_ScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: 'flex-start',
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
    color: '#95A5A6',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 25,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  actionSubtitle: {
    fontSize: 16,
    color: '#95A5A6',
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
  badgeAndButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  moreDetailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#3498db',
    borderRadius: 10,
  },
  moreDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});