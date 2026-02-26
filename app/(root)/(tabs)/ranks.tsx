import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface RankedDrink {
  drink: {
    id: string;
    drink: string;
    category: string;
    description: string;
    price: number;
    average_rating: number;
    total_ratings: number;
    cafe: { id: string; name: string } | string;
  };
  rating: number;
  comparisons: number;
  ratingContext: 'loved' | 'liked' | 'disliked';
}

type RatingContext = 'loved' | 'liked' | 'disliked';

// ─── Tier Config ────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<RatingContext, { label: string; icon: string; color: string; bgColor: string }> = {
  loved: { label: 'Loved It', icon: 'heart', color: '#2E7D32', bgColor: '#2E7D3212' },
  liked: { label: 'Liked It', icon: 'thumbs-up', color: '#F9A825', bgColor: '#F9A82512' },
  disliked: { label: "Didn't Like It", icon: 'thumbs-down', color: '#C62828', bgColor: '#C6282812' },
};

const TIER_ORDER: RatingContext[] = ['loved', 'liked', 'disliked'];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getCategoryIcon = (category: string): any => {
  const icons: Record<string, string> = {
    Coffee: 'cafe', Espresso: 'cafe', Latte: 'cafe',
    Matcha: 'leaf', Tea: 'leaf', Boba: 'water',
    Smoothie: 'nutrition', Specialty: 'sparkles', Other: 'ellipsis-horizontal',
  };
  return icons[category] || 'cafe';
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Coffee: '#795548', Espresso: '#4E342E', Latte: '#A1887F',
    Matcha: '#4CAF50', Tea: '#FF9800', Boba: '#9C27B0',
    Smoothie: '#E91E63', Specialty: '#2196F3', Other: '#607D8B',
  };
  return colors[category] || '#607D8B';
};

// ─── Ranks Screen ───────────────────────────────────────────────────────────────
const Ranks = () => {
  const [rankedDrinks, setRankedDrinks] = useState<RankedDrink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRankedDrinks();
    }, [])
  );

  const fetchRankedDrinks = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const authUserStr = await AsyncStorage.getItem('authUser');
      if (!token || !authUserStr) return;
      const authUser = JSON.parse(authUserStr);
      const userId = authUser.id;
      if (!userId) return;

      const res = await axios.get(`${API_URL}/user/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const drinks: RankedDrink[] = res.data.rankedDrinks || [];
      setRankedDrinks(drinks);
    } catch (err: any) {
      console.error('Failed to fetch ranks:', err?.response?.data || err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchRankedDrinks();
  }, []);

  // ─── Group drinks by tier ─────────────────────────────────────────────────
  const getDrinksByTier = (tier: RatingContext): RankedDrink[] => {
    return rankedDrinks
      .filter(d => d.drink != null && d.ratingContext === tier)
      .sort((a, b) => b.rating - a.rating);
  };

  const totalDrinks = rankedDrinks.filter(d => d.drink != null).length;

  // ─── Tier Section ─────────────────────────────────────────────────────────
  const renderTierSection = (tier: RatingContext) => {
    const drinks = getDrinksByTier(tier);
    if (drinks.length === 0) return null;

    const config = TIER_CONFIG[tier];

    return (
      <View style={styles.tierSection} key={tier}>
        {/* Tier header */}
        <View style={[styles.tierHeader, { backgroundColor: config.bgColor }]}>
          <View style={[styles.tierIconCircle, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon as any} size={16} color="#FFF" />
          </View>
          <Text style={[styles.tierLabel, { color: config.color }]}>{config.label}</Text>
          <View style={[styles.tierCount, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.tierCountText, { color: config.color }]}>{drinks.length}</Text>
          </View>
        </View>

        {/* Drinks in tier */}
        {drinks.map((item, index) => {
          const rank = index + 1;
          const drink = item.drink;
          const catColor = getCategoryColor(drink.category);

          return (
            <TouchableOpacity
              key={drink.id || `${tier}-${index}`}
              style={styles.drinkCard}
              activeOpacity={0.7}
            >
              {/* Rank number */}
              <View style={styles.rankContainer}>
                <Text style={[
                  styles.rankNumber,
                  rank === 1 && { color: config.color, fontWeight: '900' as const, fontSize: 18 },
                ]}>
                  {rank}
                </Text>
                {rank === 1 && (
                  <Ionicons name="trophy" size={11} color={config.color} style={{ marginTop: 2 }} />
                )}
              </View>

              {/* Category icon */}
              <View style={[styles.drinkIconContainer, { backgroundColor: catColor + '15' }]}>
                <Ionicons name={getCategoryIcon(drink.category)} size={22} color={catColor} />
              </View>

              {/* Drink info */}
              <View style={styles.drinkInfo}>
                <Text style={styles.drinkName} numberOfLines={1}>{drink.drink}</Text>
                <View style={styles.drinkMeta}>
                  <Ionicons name="location-outline" size={12} color="#999" />
                  <Text style={styles.drinkCafe} numberOfLines={1}>
                    {typeof drink.cafe === 'object' && drink.cafe?.name ? drink.cafe.name : 'Unknown cafe'}
                  </Text>
                </View>
              </View>

              {/* Score */}
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBadge, { backgroundColor: config.color }]}>
                  <Text style={styles.scoreText}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ─── Empty State ────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="trophy-outline" size={56} color="#D4C5B0" />
      </View>
      <Text style={styles.emptyTitle}>No rankings yet</Text>
      <Text style={styles.emptySubtitle}>
        Add and rate drinks to see your{'\n'}personal rankings here
      </Text>
    </View>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B4513"
          />
        }
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Rankings</Text>
          <Text style={styles.subtitle}>
            {totalDrinks} {totalDrinks === 1 ? 'drink' : 'drinks'} ranked
          </Text>
        </View>

        {totalDrinks === 0 ? (
          renderEmpty()
        ) : (
          TIER_ORDER.map(tier => renderTierSection(tier))
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },

  // Title
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },

  // Tier section
  tierSection: {
    marginBottom: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  tierIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  tierCount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tierCountText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Drink card
  drinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BBB',
  },
  drinkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drinkInfo: {
    flex: 1,
    marginRight: 10,
  },
  drinkName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  drinkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  drinkCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  drinkCafe: {
    fontSize: 12,
    color: '#999',
    marginLeft: 3,
    flex: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D4C5B0',
    marginHorizontal: 6,
  },
  drinkComparisons: {
    fontSize: 12,
    color: '#BBB',
  },

  // Score
  scoreContainer: {
    alignItems: 'center',
  },
  scoreBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B451310',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Ranks;
