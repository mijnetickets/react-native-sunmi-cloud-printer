import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SunmiSDK from 'react-native-sunmi-cloud-printer';

export default function TabLayout() {
  useEffect(() => {
    // Setup the native module
    SunmiSDK.setup();

    // Set a timeout for the native module.
    SunmiSDK.setTimeout(5000);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
        },
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-printers"
        options={{
          title: 'My Printers',
          tabBarIcon: ({ size, color }) => <Ionicons name="print" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
