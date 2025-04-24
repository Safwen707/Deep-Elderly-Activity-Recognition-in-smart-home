import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  ImageBackground,
  SafeAreaView
} from 'react-native';
import { ArrowLeftIcon, UserIcon} from 'react-native-heroicons/solid';
import { Feather } from '@expo/vector-icons';
import { useDynamicStyles } from '../hooks/useDynamicStyles';

export default function HistoriqueScreen({ navigation, route }) {
  const { styles, backgroundImage, colors } = useDynamicStyles();
  const { aiResults = [] } = route.params || {};

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filteredResults, setFilteredResults] = useState([...aiResults].reverse());
  const [filterByName, setFilterByName] = useState('');
  const [filterByDate, setFilterByDate] = useState('');
  const [filterByTime, setFilterByTime] = useState('');
  const [timeFilterType, setTimeFilterType] = useState('before');

  // Apply filters
  useEffect(() => {
    let results = [...aiResults].reverse();

    if (searchQuery) {
      results = results.filter(item =>
          item.prediction.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.timestamp.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterByName) {
      results = results.filter(item =>
          item.prediction.toLowerCase().includes(filterByName.toLowerCase())
      );
    }

    if (filterByDate) {
      results = results.filter(item => {
        const itemDate = item.timestamp.split(' ')[0];
        return itemDate.includes(filterByDate);
      });
    }

    if (filterByTime) {
      results = results.filter(item => {
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
  }, [searchQuery, filterByName, filterByDate, filterByTime, timeFilterType]);

  const parseTimeToMinutes = (timeStr) => {
    try {
      const timeParts = timeStr.match(/(\d+):(\d+):?(\d+)?\s*(AM|PM)?/i);
      if (!timeParts) return 0;

      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const isPM = timeParts[4] && timeParts[4].toUpperCase() === 'PM';

      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      return hours * 60 + minutes;
    } catch (e) {
      return 0;
    }
  };

  const resetFilters = () => {
    setFilterByName('');
    setFilterByDate('');
    setFilterByTime('');
    setTimeFilterType('before');
    setShowFilterModal(false);
  };

  const renderHeader = () => (
      <>
        {/* Header */}
        <View style={[localStyles.header, { backgroundColor: 'rgba(30, 30, 30, 0.7)' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeftIcon size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={localStyles.headerTitle}>Activity History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <UserIcon size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={localStyles.searchContainer}>
          <View style={[localStyles.searchBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <TextInput
                style={[localStyles.searchInput, { color: '#fff' }]}
                placeholder="Search activities..."
                placeholderTextColor="#95A5A6"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ color: '#95A5A6' }}>✕</Text>
                </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
              style={[localStyles.filterButton, {
                backgroundColor: filterByName || filterByDate || filterByTime ?
                    'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.1)'
              }]}
              onPress={() => setShowFilterModal(true)}
          >
            <Feather name="filter" size={20} color={
              filterByName || filterByDate || filterByTime ? "#4FC3F7" : "#95A5A6"
            } />
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {(filterByName || filterByDate || filterByTime) && (
            <View style={localStyles.activeFilters}>
              <Text style={[localStyles.activeFiltersText, { color: '#95A5A6' }]}>Active filters:</Text>
              {filterByName && (
                  <View style={[localStyles.filterTag, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                    <Text style={[localStyles.filterTagText, { color: '#4FC3F7' }]}>Name: {filterByName}</Text>
                  </View>
              )}
              {filterByDate && (
                  <View style={[localStyles.filterTag, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                    <Text style={[localStyles.filterTagText, { color: '#4FC3F7' }]}>Date: {filterByDate}</Text>
                  </View>
              )}
              {filterByTime && (
                  <View style={[localStyles.filterTag, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                    <Text style={[localStyles.filterTagText, { color: '#4FC3F7' }]}>
                      Time: {timeFilterType} {filterByTime}
                    </Text>
                  </View>
              )}
              <TouchableOpacity onPress={resetFilters}>
                <Text style={[localStyles.clearFiltersText, { color: '#4FC3F7' }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
        )}

        {/* Empty State */}
        {filteredResults.length === 0 && (
            <View style={[localStyles.emptyCard, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
              <Text style={[localStyles.emptyText, { color: '#fff' }]}>No matching activities found.</Text>
              <Text style={[localStyles.emptySubtext, { color: '#95A5A6' }]}>
                {aiResults.length > 0
                    ? "Try adjusting your search or filters."
                    : "Activities will appear here once detected."}
              </Text>
            </View>
        )}

        {/* Results Header */}
        {filteredResults.length > 0 && (
            <View style={[localStyles.historyHeader, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
              <Text style={[localStyles.cardTitle, { color: '#fff' }]}>Detected Activities</Text>
              <Text style={[localStyles.resultCount, { color: '#95A5A6' }]}>
                {filteredResults.length} results
              </Text>
            </View>
        )}
      </>
  );

  const renderHistoryItem = ({ item }) => (
      <View style={[localStyles.historyItem, { backgroundColor: 'rgba(40, 40, 40, 0.85)' }]}>
        <Text style={[localStyles.aiTimestamp, { color: '#95A5A6' }]}>{item.timestamp}</Text>
        <Text style={[localStyles.historyPrediction, { color: '#fff' }]}>{item.prediction}</Text>
        <Text style={[localStyles.historyF1_Score, { color: '#F1C40F' }]}>
          F1 score: {item.F1_Score}
        </Text>
      </View>
  );

  return (
      <ImageBackground
          source={require("../assets/DarkMode.png")}
          style={localStyles.background}
          resizeMode="cover"
      >
        <SafeAreaView style={localStyles.safeArea}>
          <FlatList
              data={filteredResults}
              keyExtractor={(item, index) => `ai-history-${index}`}
              renderItem={renderHistoryItem}
              ListHeaderComponent={renderHeader}
              contentContainerStyle={localStyles.content}
          />

          {/* Filter Modal */}
          <Modal
              visible={showFilterModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={localStyles.modalOverlay}>
              <View style={[localStyles.modalContent, { backgroundColor: 'rgba(40, 40, 40, 0.95)' }]}>
                <View style={localStyles.modalHeader}>
                  <Text style={[localStyles.modalTitle, { color: '#fff' }]}>Filter Results</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Text style={{ color: '#fff' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={localStyles.modalScrollView}>
                  {/* Filter sections with dark theme styling */}
                  <View style={localStyles.filterSection}>
                    <Text style={[localStyles.filterLabel, { color: '#fff' }]}>Activity Name</Text>
                    <TextInput
                        style={[localStyles.filterInput, {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#fff'
                        }]}
                        placeholder="Filter by activity name"
                        placeholderTextColor="#95A5A6"
                        value={filterByName}
                        onChangeText={setFilterByName}
                    />
                  </View>

                  <View style={localStyles.filterSection}>
                    <Text style={[localStyles.filterLabel, { color: '#fff' }]}>Date</Text>
                    <TextInput
                        style={[localStyles.filterInput, {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#fff'
                        }]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#95A5A6"
                        value={filterByDate}
                        onChangeText={setFilterByDate}
                    />
                  </View>

                  <View style={localStyles.filterSection}>
                    <Text style={[localStyles.filterLabel, { color: '#fff' }]}>Time</Text>
                    <View style={localStyles.timeFilterRow}>
                      <TouchableOpacity
                          style={[
                            localStyles.timeFilterButton,
                            timeFilterType === 'before' && localStyles.timeFilterButtonActive
                          ]}
                          onPress={() => setTimeFilterType('before')}
                      >
                        <Text style={[
                          localStyles.timeFilterText,
                          timeFilterType === 'before' && localStyles.timeFilterTextActive
                        ]}>Before</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                          style={[
                            localStyles.timeFilterButton,
                            timeFilterType === 'after' && localStyles.timeFilterButtonActive
                          ]}
                          onPress={() => setTimeFilterType('after')}
                      >
                        <Text style={[
                          localStyles.timeFilterText,
                          timeFilterType === 'after' && localStyles.timeFilterTextActive
                        ]}>After</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[localStyles.filterInput, {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#fff'
                        }]}
                        placeholder="HH:MM AM/PM"
                        placeholderTextColor="#95A5A6"
                        value={filterByTime}
                        onChangeText={setFilterByTime}
                    />
                  </View>
                </ScrollView>

                <View style={localStyles.modalFooter}>
                  <TouchableOpacity
                      style={[localStyles.resetButton, { borderColor: '#4FC3F7' }]}
                      onPress={resetFilters}
                  >
                    <Text style={[localStyles.resetButtonText, { color: '#4FC3F7' }]}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      style={[localStyles.applyButton, { backgroundColor: '#4FC3F7' }]}
                      onPress={() => setShowFilterModal(false)}
                  >
                    <Text style={[localStyles.applyButtonText, { color: '#fff' }]}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  container: {
    padding: 16,
    paddingBottom: 32,
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
    color:"white"
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  activeFiltersText: {
    fontSize: 14,
    marginRight: 8,
  },
  filterTag: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 5,
  },
  filterTagText: {
    fontSize: 12,
  },
  clearFiltersText: {
    fontSize: 14,
    marginLeft: 5,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 30,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  historyHeader: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCount: {
    fontSize: 12,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  aiTimestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyPrediction: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  historyF1_Score: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 8,
  },
  filterInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 5,
    borderRadius: 8,
  },
  timeFilterButtonActive: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderColor: '#4FC3F7',
  },
  timeFilterText: {
    color: '#fff',
  },
  timeFilterTextActive: {
    color: '#4FC3F7',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 16,
  },
  applyButton: {
    padding: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});