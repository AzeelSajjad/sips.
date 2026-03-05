import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface RankedDrink {
  drink: any;
  rating: number;
  comparisons: number;
  ratingContext: 'loved' | 'liked' | 'disliked';
}

interface UserData {
  name: string;
  email: string;
  profilePicture: string | null;
  createdAt: string;
  rankedDrinks: RankedDrink[];
  friends: any[];
}

// ─── Profile Screen ─────────────────────────────────────────────────────────────
const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const authStr = await AsyncStorage.getItem('authUser');
      if (!authStr) return;
      const { id: userId } = JSON.parse(authStr);
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['authToken', 'authUser']);
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const drinks = user?.rankedDrinks || [];
  const lovedCount = drinks.filter(d => d.ratingContext === 'loved').length;
  const likedCount = drinks.filter(d => d.ratingContext === 'liked').length;
  const dislikedCount = drinks.filter(d => d.ratingContext === 'disliked').length;
  const totalDrinks = drinks.length;

  // Count unique cafes
  const uniqueCafes = new Set(
    drinks.map(d => d.drink?.cafe?.toString?.() || d.drink?.cafe?._id || d.drink?.cafe).filter(Boolean)
  ).size;

  const friendCount = user?.friends?.length || 0;
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  // Tier bar widths
  const barTotal = Math.max(totalDrinks, 1);
  const lovedPct = (lovedCount / barTotal) * 100;
  const likedPct = (likedCount / barTotal) * 100;
  const dislikedPct = (dislikedCount / barTotal) * 100;

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#C62828" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(root)/(tabs)/ranks');
            }}
          >
            <Text style={styles.statNumber}>{uniqueCafes}</Text>
            <Text style={styles.statLabel}>Places</Text>
            <Ionicons name="cafe-outline" size={16} color="#8B4513" style={styles.statIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(root)/(tabs)/ranks');
            }}
          >
            <Text style={styles.statNumber}>{totalDrinks}</Text>
            <Text style={styles.statLabel}>Drinks</Text>
            <Ionicons name="wine-outline" size={16} color="#8B4513" style={styles.statIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(root)/friends');
            }}
          >
            <Text style={styles.statNumber}>{friendCount}</Text>
            <Text style={styles.statLabel}>Friends</Text>
            <Ionicons name="people-outline" size={16} color="#8B4513" style={styles.statIcon} />
          </TouchableOpacity>
        </View>

        {/* Tier breakdown */}
        {totalDrinks > 0 && (
          <View style={styles.tierSection}>
            <Text style={styles.sectionTitle}>Your Taste</Text>

            <View style={styles.tierBar}>
              {lovedPct > 0 && <View style={[styles.tierSegment, { width: `${lovedPct}%`, backgroundColor: '#2E7D32' }]} />}
              {likedPct > 0 && <View style={[styles.tierSegment, { width: `${likedPct}%`, backgroundColor: '#F9A825' }]} />}
              {dislikedPct > 0 && <View style={[styles.tierSegment, { width: `${dislikedPct}%`, backgroundColor: '#C62828' }]} />}
            </View>

            <View style={styles.tierLegend}>
              <View style={styles.tierLegendItem}>
                <View style={[styles.tierDot, { backgroundColor: '#2E7D32' }]} />
                <Text style={styles.tierLegendText}>Loved ({lovedCount})</Text>
              </View>
              <View style={styles.tierLegendItem}>
                <View style={[styles.tierDot, { backgroundColor: '#F9A825' }]} />
                <Text style={styles.tierLegendText}>Liked ({likedCount})</Text>
              </View>
              <View style={styles.tierLegendItem}>
                <View style={[styles.tierDot, { backgroundColor: '#C62828' }]} />
                <Text style={styles.tierLegendText}>Disliked ({dislikedCount})</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#999',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Profile card
  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#BBB',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statIcon: {
    marginTop: 8,
  },

  // Tier section
  tierSection: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  tierBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0EDE8',
    overflow: 'hidden',
    marginBottom: 14,
  },
  tierSegment: {
    height: 10,
  },
  tierLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tierLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierLegendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default Profile;
