import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
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
    backgroundGradientFrom: '#eef3f8',
    backgroundGradientTo: '#eef3f8',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    labelColor: () => '#7f8c8d',
    style: { borderRadius: 16 },
    propsForBackgroundLines: { strokeDasharray: '' },
    barPercentage: 0.7, // Make bars slightly narrower
  };
  const occChartConfig = {
    backgroundGradientFrom: '#fdf3e7',
    backgroundGradientTo: '#fdf3e7',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
    labelColor: () => '#7f8c8d',
    style: { borderRadius: 16 },
    propsForBackgroundLines: { strokeDasharray: '' },
    barPercentage: 0.7, // Make bars slightly narrower
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
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
            <View style={[styles.iconContainer, { backgroundColor: '#e8f4fc' }]}>  
              <Ionicons name="stats-chart" size={30} color="#2980b9" />
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
            <View style={[styles.iconContainer, { backgroundColor: '#fdf3e7' }]}>  
              <MaterialCommunityIcons name="chart-bar" size={30} color="#d35400" />
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
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
    overflow: 'hidden', // This prevents content from overflowing
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
    color: '#2c3e50',
  },
  chartContainer: {
    alignItems: 'center', // Center the chart horizontally
  },
  chartStyle: {
    borderRadius: 16,
    marginLeft: -10, // Adjust chart position to fit properly
  },
});