import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const FILTERS = ['Nearby', 'Trending', 'Friends', 'Top Rated', 'New'];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 8) return '#2E7D32';
  if (rating >= 6) return '#F9A825';
  return '#C62828';
};

export const getContextLabel = (context: 'loved' | 'liked' | 'disliked'): { text: string; color: string } => {
  switch (context) {
    case 'loved': return { text: 'Loved it', color: '#2E7D32' };
    case 'liked': return { text: 'Liked it', color: '#F9A825' };
    case 'disliked': return { text: "Didn't like it", color: '#C62828' };
  }
};

// ─── Reusable Components ────────────────────────────────────────────────────────

export const ScoreBadge = ({ rating, size = 40 }: { rating: number; size?: number }) => (
  <View style={[
    styles.scoreBadge,
    { width: size, height: size, borderRadius: size / 2, backgroundColor: getRatingColor(rating) },
  ]}>
    <Text style={[styles.scoreText, { fontSize: size * 0.35 }]}>{rating.toFixed(1)}</Text>
  </View>
);

// ─── Main Screen ────────────────────────────────────────────────────────────────
const Home = () => {
  const [userName, setUserName] = useState('');
  const [activeFilter, setActiveFilter] = useState('Nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      const userData = await AsyncStorage.getItem('authUser');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || '');
      }
    } catch {
      // silently fail
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: fetch real data here
    await new Promise(resolve => setTimeout(resolve, 1200));
    setRefreshing(false);
  };

  const handleFilterPress = (filter: string) => {
    setActiveFilter(filter);
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B4513"
            colors={['#8B4513']}
          />
        }
      >
        {/* ── Header ────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName || 'Coffee Lover'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ────────────────────────── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cafes, drinks, friends..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter Chips ──────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => handleFilterPress(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Featured Section ──────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Drinks</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state — will be replaced with FlatList of real data */}
        <View style={styles.emptyFeatured}>
          <View style={styles.emptyFeaturedIcon}>
            <Ionicons name="cafe-outline" size={32} color="#C4A882" />
          </View>
          <Text style={styles.emptyFeaturedTitle}>Discover top drinks</Text>
          <Text style={styles.emptyFeaturedSubtitle}>
            Start rating drinks and we'll feature the best ones here
          </Text>
        </View>

        {/* ── Activity Feed ─────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state — will be replaced with activity cards */}
        <View style={styles.emptyFeed}>
          <View style={styles.emptyFeedIcon}>
            <Ionicons name="people-outline" size={40} color="#C4A882" />
          </View>
          <Text style={styles.emptyFeedTitle}>No activity yet</Text>
          <Text style={styles.emptyFeedSubtitle}>
            Add friends and rate drinks to see what everyone is sipping
          </Text>
          <TouchableOpacity style={styles.emptyFeedButton}>
            <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.emptyFeedButtonText}>Find Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 10,
  },

  // Filters
  filterContainer: {
    marginTop: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4E0',
  },
  filterChipActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },

  // Score Badge
  scoreBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Empty States
  emptyFeatured: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyFeaturedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B451310',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyFeaturedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptyFeaturedSubtitle: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },

  emptyFeed: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyFeedIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8B451310',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyFeedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyFeedSubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptyFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyFeedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Home;
