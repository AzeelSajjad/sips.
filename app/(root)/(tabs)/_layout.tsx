import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Platform, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

type TabIconName = keyof typeof Ionicons.glyphMap;

const TabIcon = ({ name, focused }: { name: TabIconName; focused: boolean }) => (
  <View style={styles.tabIconContainer}>
    <Ionicons name={name} size={24} color={focused ? '#8B4513' : '#999999'} />
    {focused && <View style={styles.activeIndicator} />}
  </View>
);

const HapticTab = ({ onPress, style, children, ...rest }: any) => (
  <TouchableOpacity
    {...rest}
    style={style}
    onPress={(e: GestureResponderEvent) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    }}
  >
    {children}
  </TouchableOpacity>
);

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFFFA' }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
          tabBarButton: (props: any) => <HapticTab {...props} />,
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} />
          ),
          tabBarButton: (props: any) => <HapticTab {...props} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          ),
          tabBarButton: (props: any) => (
            <HapticTab {...props} style={styles.addButtonWrapper} />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'map' : 'map-outline'} focused={focused} />
          ),
          tabBarButton: (props: any) => <HapticTab {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
          tabBarButton: (props: any) => <HapticTab {...props} />,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 70,
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#8B4513',
  },
  addButtonWrapper: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default TabsLayout;
