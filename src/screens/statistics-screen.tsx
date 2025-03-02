import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import { statisticsService } from '../services/statistics-service';

interface StatisticsScreenProps {
  route: {
    params: {
      deviceId: string;
    };
  };
}

type TransitionType = 'aor_to_p2' | 'p2_to_ecopr' | 'ecopr_to_prcard' | null;

export default function StatisticsScreen({ route }: StatisticsScreenProps) {
  const { deviceId } = route.params;
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>(null);

  const screenWidth = Dimensions.get('window').width - 32; // Accounting for padding

  useEffect(() => {
    loadStats();
  }, [selectedTransition]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getCommunityStats({
        transitionType: selectedTransition,
      });
      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransitionLabel = (type: string) => {
    switch (type) {
      case 'aor_to_p2':
        return 'AOR to P2';
      case 'p2_to_ecopr':
        return 'P2 to ecoPR';
      case 'ecopr_to_prcard':
        return 'ecoPR to PR Card';
      default:
        return type;
    }
  };

  // Prepare data for chart
  const prepareChartData = () => {
    // Group by month for simplicity
    const monthlyData: Record<string, { count: number; avgDays: number }> = {};

    stats.forEach((stat) => {
      const date = new Date(stat.start_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { count: 0, avgDays: 0 };
      }

      monthlyData[monthYear].count += stat.count;
      monthlyData[monthYear].avgDays += stat.avg_days * stat.count;
    });

    // Calculate averages
    Object.keys(monthlyData).forEach((key) => {
      if (monthlyData[key].count > 0) {
        monthlyData[key].avgDays = monthlyData[key].avgDays / monthlyData[key].count;
      }
    });

    // Sort by date
    const sortedLabels = Object.keys(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    });

    return {
      labels: sortedLabels,
      datasets: [
        {
          data: sortedLabels.map((label) => monthlyData[label].avgDays),
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
        },
      ],
    };
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="mb-6 text-2xl font-bold">Community Statistics</Text>

      <Text className="mb-2 font-bold">Filter by Transition</Text>
      <View className="mb-6 flex-row flex-wrap">
        {[
          { value: null as TransitionType, label: 'All' },
          { value: 'aor_to_p2' as TransitionType, label: 'AOR to P2' },
          { value: 'p2_to_ecopr' as TransitionType, label: 'P2 to ecoPR' },
          { value: 'ecopr_to_prcard' as TransitionType, label: 'ecoPR to PR Card' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            className={`mb-2 mr-2 rounded-md px-4 py-2 ${
              selectedTransition === item.value ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            onPress={() => setSelectedTransition(item.value)}>
            <Text
              className={`font-medium ${
                selectedTransition === item.value ? 'text-white' : 'text-gray-800'
              }`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : stats.length === 0 ? (
        <View className="items-center justify-center py-10">
          <Text className="text-gray-500">No statistics available yet</Text>
        </View>
      ) : (
        <>
          <Text className="mb-4 font-bold">Average Processing Time (Days)</Text>

          {stats.length > 0 && (
            <BarChart
              data={prepareChartData()}
              width={screenWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" days"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          )}

          <Text className="mb-2 mt-6 font-bold">Detailed Statistics</Text>

          {stats.map((stat, index) => (
            <View key={index} className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <Text className="font-bold">{getTransitionLabel(stat.transition_type)}</Text>
              <Text>Start Date: {new Date(stat.start_date).toLocaleDateString()}</Text>
              <Text>Average Days: {Math.round(stat.avg_days)}</Text>
              <Text>Min Days: {stat.min_days}</Text>
              <Text>Max Days: {stat.max_days}</Text>
              <Text>Sample Size: {stat.count}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
