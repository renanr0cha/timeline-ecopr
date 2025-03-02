import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AddEntryScreen from '../screens/add-entry-screen';
import HomeScreen from '../screens/home-screen';
import StatisticsScreen from '../screens/statistics-screen';

export type RootStackParamList = {
  Home: { deviceId: string };
  AddEntry: { deviceId: string };
  Statistics: { deviceId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  deviceId: string;
}

export function AppNavigator({ deviceId }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          initialParams={{ deviceId }}
          options={{ title: 'Timeline ecoPR' }}
        />
        <Stack.Screen 
          name="AddEntry" 
          component={AddEntryScreen} 
          initialParams={{ deviceId }}
          options={{ title: 'Add Timeline Entry' }}
        />
        <Stack.Screen 
          name="Statistics" 
          component={StatisticsScreen} 
          initialParams={{ deviceId }}
          options={{ title: 'Community Statistics' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
