import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import { ScreenContent } from '../components/screen-content';
import { logger } from '../lib/logger';
import { statisticsService } from '../services/statistics-service';
import { CommunityStatistic } from '../types';

/**
 * Transition type options for filtering
 */
const TRANSITION_TYPES = [
  { label: 'All', value: undefined },
  { label: 'AOR → P2', value: 'aor-p2' },
  { label: 'P2 → ecoPR', value: 'p2-ecopr' },
  { label: 'ecoPR → PR Card', value: 'ecopr-pr_card' },
];

/**
 * Screen for displaying community statistics
 */
export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<CommunityStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransitionType, setSelectedTransitionType] = useState<string | undefined>(
    undefined
  );
  const screenWidth = Dimensions.get('window').width;

  /**
   * Load community statistics from the service
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getCommunityStats(selectedTransitionType);
      setStatistics(data);
    } catch (error) {
      logger.error('Error loading statistics', { error });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics when component mounts or filter changes
  useEffect(() => {
    loadStatistics();
  }, [selectedTransitionType]);

  /**
   * Prepare data for the bar chart
   */
  const getChartData = () => {
    // If no data, return empty chart data
    if (!statistics.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sort by date and take last 6 for the chart
    const sortedStats = [...statistics].sort((a, b) => {
      if (!a.month_year || !b.month_year) return 0;
      return new Date(a.month_year).getTime() - new Date(b.month_year).getTime();
    });

    const recentStats = sortedStats.slice(-6);

    return {
      labels: recentStats.map((stat) => stat.month_year || 'Unknown'),
      datasets: [
        {
          data: recentStats.map((stat) => stat.avg_days),
        },
      ],
    };
  };

  /**
   * Renders the filter button row
   */
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {TRANSITION_TYPES.map((type) => (
        <TouchableOpacity
          key={type.label}
          style={[
            styles.filterButton,
            selectedTransitionType === type.value ? styles.selectedFilter : null,
          ]}
          onPress={() => setSelectedTransitionType(type.value)}>
          <Text
            style={[
              styles.filterButtonText,
              selectedTransitionType === type.value ? styles.selectedFilterText : null,
            ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  /**
   * Renders the statistics cards
   */
  const renderStatisticsCards = () => (
    <View style={styles.cardsContainer}>
      {statistics.length > 0 ? (
        statistics.map((stat, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>
              {stat.transition_type} {stat.month_year ? `(${stat.month_year})` : ''}
            </Text>
            <View style={styles.cardRow}>
              <View style={styles.cardItem}>
                <Text style={styles.cardItemLabel}>Avg Days</Text>
                <Text style={styles.cardItemValue}>{stat.avg_days.toFixed(1)}</Text>
              </View>
              <View style={styles.cardItem}>
                <Text style={styles.cardItemLabel}>Min Days</Text>
                <Text style={styles.cardItemValue}>{stat.min_days}</Text>
              </View>
              <View style={styles.cardItem}>
                <Text style={styles.cardItemLabel}>Max Days</Text>
                <Text style={styles.cardItemValue}>{stat.max_days}</Text>
              </View>
              <View style={styles.cardItem}>
                <Text style={styles.cardItemLabel}>Count</Text>
                <Text style={styles.cardItemValue}>{stat.count}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No statistics available for this selection</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContent>
      <View style={styles.container}>
        <Text style={styles.title}>Community Statistics</Text>
        <Text style={styles.subtitle}>View processing times from the community</Text>

        {renderFilterButtons()}

        {loading ? (
          <ActivityIndicator size="large" color="#0284c7" style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Average Processing Times (Days)</Text>
              <BarChart
                data={getChartData()}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" days"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
                verticalLabelRotation={30}
              />
            </View>

            {renderStatisticsCards()}
          </ScrollView>
        )}
      </View>
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  selectedFilter: {
    backgroundColor: '#0284c7',
  },
  filterButtonText: {
    color: '#64748b',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#ffffff',
  },
  loader: {
    marginTop: 40,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#0f172a',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  cardsContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#0f172a',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  cardItem: {
    minWidth: '22%',
    marginBottom: 8,
  },
  cardItemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  cardItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});
