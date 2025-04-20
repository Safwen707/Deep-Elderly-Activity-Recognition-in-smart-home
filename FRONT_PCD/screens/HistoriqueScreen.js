// src/screens/HistoriqueScreen.js
import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';

export default function HistoriqueScreen({ navigation, route }) {
  const today = new Date().toDateString();
  // We'll receive aiResults from the route params when navigating to this screen
  const { aiResults = [] } = route.params || {};
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filteredResults, setFilteredResults] = useState([...aiResults].reverse());
  
  // Filter options
  const [filterByName, setFilterByName] = useState('');
  const [filterByDate, setFilterByDate] = useState('');
  const [filterByTime, setFilterByTime] = useState('');
  const [timeFilterType, setTimeFilterType] = useState('before'); // 'before', 'after', 'between'
  
  // Apply filters whenever search or filter values change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterByName, filterByDate, filterByTime, timeFilterType]);
  
  // Filter function
  const applyFilters = () => {
    let results = [...aiResults].reverse();
    
    // Apply search query
    if (searchQuery) {
      results = results.filter(item => 
        item.prediction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.timestamp.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply name filter
    if (filterByName) {
      results = results.filter(item => 
        item.prediction.toLowerCase().includes(filterByName.toLowerCase())
      );
    }
    
    // Apply date filter
    if (filterByDate) {
      results = results.filter(item => {
        // Extract date part from timestamp (assuming format like "6:00:31 PM")
        // In a real app, you would need to parse actual dates from your timestamps
        const itemDate = item.timestamp.split(' ')[0]; // This is simplified
        return itemDate.includes(filterByDate);
      });
    }
    
    // Apply time filter
    if (filterByTime) {
      results = results.filter(item => {
        // Extract time from timestamp (assuming format has time like "6:00:31 PM")
        const timeStr = item.timestamp;
        const timeNum = parseTimeToMinutes(timeStr);
        const filterTimeNum = parseTimeToMinutes(filterByTime);
        
        if (timeFilterType === 'before') {
          return timeNum <= filterTimeNum;
        } else if (timeFilterType === 'after') {
          return timeNum >= filterTimeNum;
        }
        return true;
      });
    }
    
    setFilteredResults(results);
  };
  
  // Helper function to convert time string to minutes for comparison
  const parseTimeToMinutes = (timeStr) => {
    try {
      // Extract time components
      const timeParts = timeStr.match(/(\d+):(\d+):?(\d+)?\s*(AM|PM)?/i);
      if (!timeParts) return 0;
      
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const isPM = timeParts[4] && timeParts[4].toUpperCase() === 'PM';
      
      // Convert to 24-hour format
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    } catch (e) {
      return 0;
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterByName('');
    setFilterByDate('');
    setFilterByTime('');
    setTimeFilterType('before');
    setShowFilterModal(false);
  };

  // Header component for FlatList
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="leftcircle" size={32} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.title}>Historic </Text>
      </View>
      
      <Text style={styles.subtitle}>Review past activities detected by the system.</Text>
      
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Feather 
            name="filter" 
            size={22} 
            color={filterByName || filterByDate || filterByTime ? "#3498db" : "#666"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Active Filters Display */}
      {(filterByName || filterByDate || filterByTime) && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>Active filters:</Text>
          {filterByName && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>Name: {filterByName}</Text>
            </View>
          )}
          {filterByDate && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>Date: {filterByDate}</Text>
            </View>
          )}
          {filterByTime && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>
                Time: {timeFilterType} {filterByTime}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFiltersText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Date Card */}
      <View style={styles.dateCard}>
        <Text style={styles.cardTitle}>Timeline</Text>
        <Text style={styles.date}>{today}</Text>
      </View>
      
      {/* Empty state - shown when no results */}
      {filteredResults.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No matching activities found.</Text>
          <Text style={styles.emptySubtext}>
            {aiResults.length > 0 
              ? "Try adjusting your search or filters."
              : "Activities will appear here once detected."}
          </Text>
        </View>
      )}
      
      {/* Header for results section */}
      {filteredResults.length > 0 && (
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>All Detected Activities</Text>
          <Text style={styles.resultCount}>{filteredResults.length} results</Text>
        </View>
      )}
    </>
  );

  // Render individual history items
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.aiTimestamp}>{item.timestamp}</Text>
      <Text style={styles.historyPrediction}>{item.prediction}</Text>
      <Text style={styles.historyF1_Score}>F1_Score: {item.F1_Score}</Text>
    </View>
  );

  return (
    <>
      <FlatList
        data={filteredResults}
        keyExtractor={(item, index) => `ai-history-${index}`}
        renderItem={renderHistoryItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.container}
        ListEmptyComponent={null} // We handle the empty state in the header
      />
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Results</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Filter by activity name */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Activity Name</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Filter by activity name"
                  value={filterByName}
                  onChangeText={setFilterByName}
                />
              </View>
              
              {/* Filter by date */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Date</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  value={filterByDate}
                  onChangeText={setFilterByDate}
                />
              </View>
              
              {/* Filter by time */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Time</Text>
                <View style={styles.timeFilterRow}>
                  <TouchableOpacity
                    style={[
                      styles.timeFilterButton,
                      timeFilterType === 'before' && styles.timeFilterButtonActive
                    ]}
                    onPress={() => setTimeFilterType('before')}
                  >
                    <Text style={[
                      styles.timeFilterText,
                      timeFilterType === 'before' && styles.timeFilterTextActive
                    ]}>Before</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.timeFilterButton,
                      timeFilterType === 'after' && styles.timeFilterButtonActive
                    ]}
                    onPress={() => setTimeFilterType('after')}
                  >
                    <Text style={[
                      styles.timeFilterText,
                      timeFilterType === 'after' && styles.timeFilterTextActive
                    ]}>After</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.filterInput}
                  placeholder="HH:MM AM/PM"
                  value={filterByTime}
                  onChangeText={setFilterByTime}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
  },
  
  // Search bar styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  // Active filters styles
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 15,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  filterTag: {
    backgroundColor: '#e1f0ff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 5,
  },
  filterTagText: {
    fontSize: 12,
    color: '#3498db',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 5,
  },
  
  // Date card styles
  dateCard: {
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
  historyHeader: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E',
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
  historyItem: {
    padding: 15,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#9E9E9E',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  aiTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    maxHeight: 450,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeFilterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timeFilterButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 5,
  },
  timeFilterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  timeFilterText: {
    color: '#333',
  },
  timeFilterTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  resetButtonText: {
    color: '#333',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});