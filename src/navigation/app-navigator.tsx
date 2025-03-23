import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AddEntryScreen from '../screens/add-entry-screen';
import HomeScreen from '../screens/home-screen';
import MockDataDemo from '../screens/mock-data-demo';
import StatisticsScreen from '../screens/statistics-screen';
import { AuthState, RootStackParamList, TabsParamList } from '../types';

interface AppNavigatorProps {
  authState: AuthState;
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

/**
 * Bottom tabs navigator component
 */
const TabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StatisticsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Timeline' }}
      />
      <Tab.Screen 
        name="StatisticsTab" 
        component={StatisticsScreen} 
        options={{ title: 'Statistics' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main application navigator component
 * Sets up the stack navigation structure
 */
export function AppNavigator({ authState }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
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
          name="Main"
          options={{ headerShown: false }}
        >
          {() => <TabsNavigator />}
        </Stack.Screen>
        <Stack.Screen
          name="AddEntry"
          component={AddEntryScreen}
          options={{
            title: 'Add Entry',
            presentation: 'modal',
            animation: 'slide_from_bottom',
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
