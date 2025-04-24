import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, ImageBackground } from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 60; // Reduced width to prevent overflow

export default function DashboardScreen({ navigation }) {
  // Fake data for demonstration
  const f1Data = {
    labels: ['Walking', 'Running', 'Sitting', 'Standing', 'Lying'],
    datasets: [{ data: [0.75, 0.85, 0.60, 0.90, 0.50] }],
  };
  const occData = {
    labels: ['Walking', 'Running', 'Sitting', 'Standing', 'Lying'],
    datasets: [{ data: [20, 35, 15, 40, 10] }],
  };

  // Chart configurations
  const f1ChartConfig = {
    backgroundGradientFrom: 'rgba(40, 40, 40, 0.8)',
    backgroundGradientTo: 'rgba(40, 40, 40, 0.8)',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    labelColor: () => '#95A5A6',
    style: { borderRadius: 16 },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255,255,255,0.1)'
    },
    barPercentage: 0.7,
  };
  const occChartConfig = {
    backgroundGradientFrom: 'rgba(40, 40, 40, 0.8)',
    backgroundGradientTo: 'rgba(40, 40, 40, 0.8)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
    labelColor: () => '#95A5A6',
    style: { borderRadius: 16 },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255,255,255,0.1)'
    },
    barPercentage: 0.7,
  };

  return (
      <ImageBackground
          source={require('../assets/DarkMode.png')}
          style={styles.background}
      >
        <StatusBar barStyle="light-content" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <AntDesign name="leftcircle" size={32} color="#3498db" />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* F1 Score Chart */}
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                <Ionicons name="stats-chart" size={30} color="#3498db" />
              </View>
              <Text style={styles.cardTitle}>F1 Score par activité</Text>
            </View>
            <View style={styles.chartContainer}>
              <BarChart
                  data={f1Data}
                  width={chartWidth}
                  height={220}
                  chartConfig={f1ChartConfig}
                  style={styles.chartStyle}
                  fromZero
                  showValuesOnTopOfBars
              />
            </View>
          </TouchableOpacity>

          {/* Occurrences Chart */}
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(231, 76, 60, 0.2)' }]}>
                <MaterialCommunityIcons name="chart-bar" size={30} color="#e74c3c" />
              </View>
              <Text style={styles.cardTitle}>Nombre d'occurrences</Text>
            </View>
            <View style={styles.chartContainer}>
              <BarChart
                  data={occData}
                  width={chartWidth}
                  height={220}
                  chartConfig={occChartConfig}
                  style={styles.chartStyle}
                  fromZero
                  showValuesOnTopOfBars
              />
            </View>
          </TouchableOpacity>
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
  card: {
    backgroundColor: 'rgba(40, 40, 40, 0.85)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartStyle: {
    borderRadius: 16,
    marginLeft: -10,
  },
});