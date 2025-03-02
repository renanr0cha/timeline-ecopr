import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import AddEntryScreen from '../screens/add-entry-screen';
import HomeScreen from '../screens/home-screen';
import MockDataDemo from '../screens/mock-data-demo';
import StatisticsScreen from '../screens/statistics-screen';
import { RootStackParamList } from '../types';

interface AppNavigatorProps {
  deviceId: string;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Main application navigator component
 * Sets up the stack navigation structure
 */
export function AppNavigator({ deviceId }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: '#0f172a',
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#f8fafc',
          },
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ deviceId }}
          options={({ navigation }) => ({
            title: 'Timeline',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('MockDataDemo')}
                className="mr-2">
                <Ionicons name="layers-outline" size={24} color="#0284c7" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="AddEntry"
          component={AddEntryScreen}
          initialParams={{ deviceId }}
          options={{
            title: 'Add Entry',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Statistics"
          component={StatisticsScreen}
          initialParams={{ deviceId }}
          options={{
            title: 'Statistics',
          }}
        />
        <Stack.Screen
          name="MockDataDemo"
          component={MockDataDemo}
          options={{
            title: 'UI Components Demo',
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
