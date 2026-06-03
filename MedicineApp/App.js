import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import our screens
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';

// Create the navigation stack
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#10b981', // Our medical green theme
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* The Home Screen */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'AI Pharmacist' }} 
        />
        
        {/* The Results Screen */}
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen} 
          options={{ title: 'Generic Alternatives' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}