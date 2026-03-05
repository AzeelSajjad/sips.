import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const { width, height } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────────
interface RatedCafe {
  name: string;
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
  topDrink: string;
  topRating: number;
  ratingContext: 'loved' | 'liked' | 'disliked';
}

interface NearbyCafe {
  name: string;
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
}

type FilterMode = 'all' | 'mine' | 'nearby';

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getTierColor = (context: string) => {
  if (context === 'loved') return '#2E7D32';
  if (context === 'liked') return '#F9A825';
  return '#C62828';
};

const getTierLabel = (context: string) => {
  if (context === 'loved') return 'Loved';
  if (context === 'liked') return 'Liked';
  return 'Disliked';
};

// ─── Maps Screen ────────────────────────────────────────────────────────────────
const Maps = () => {
  const mapRef = useRef<MapView>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  const [ratedCafes, setRatedCafes] = useState<RatedCafe[]>([]);
  const [nearbyCafes, setNearbyCafes] = useState<NearbyCafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<RatedCafe | NearbyCafe | null>(null);
  const [selectedIsRated, setSelectedIsRated] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const userRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setRegion(userRegion);

      const token = await AsyncStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch rated cafes and nearby cafes in parallel
      const [ratedRes, nearbyRes] = await Promise.allSettled([
        axios.get(`${API_URL}/map/rated-cafes`, { headers }),
        axios.get(`${API_URL}/map/cafes`, {
          params: {
            loc: `${loc.coords.latitude},${loc.coords.longitude}`,
          },
          headers,
        }),
      ]);

      if (ratedRes.status === 'fulfilled') {
        setRatedCafes(ratedRes.value.data);
      }

      if (nearbyRes.status === 'fulfilled' && Array.isArray(nearbyRes.value.data)) {
        // Filter out cafes the user has already rated
        const ratedPlaceIds = new Set(
          ratedRes.status === 'fulfilled'
            ? ratedRes.value.data.map((c: RatedCafe) => c.placeId)
            : []
        );
        const unvisited = nearbyRes.value.data.filter(
          (c: NearbyCafe) => !ratedPlaceIds.has(c.placeId)
        );
        setNearbyCafes(unvisited);
      }
    } catch (err) {
      console.error('Maps load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Pin tap handlers ───────────────────────────────────────────────────────
  const handleRatedPinPress = (cafe: RatedCafe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCafe(cafe);
    setSelectedIsRated(true);
    showCard();
  };

  const handleNearbyPinPress = (cafe: NearbyCafe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCafe(cafe);
    setSelectedIsRated(false);
    showCard();
  };

  const showCard = () => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const hideCard = () => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedCafe(null));
  };

  const recenter = () => {
    if (region && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion(region, 500);
    }
  };

  // ─── Filter logic ───────────────────────────────────────────────────────────
  const showRated = filter === 'all' || filter === 'mine';
  const showNearby = filter === 'all' || filter === 'nearby';

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#8B4513" size="large" />
        <Text style={styles.loadingText}>Finding cafes near you...</Text>
      </View>
    );
  }

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Rated cafe pins */}
        {showRated && ratedCafes.map(cafe => (
          <Marker
            key={`rated-${cafe.placeId}`}
            coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
            onPress={() => handleRatedPinPress(cafe)}
          >
            <View style={styles.ratedPinContainer}>
              <View style={[styles.ratedPin, { backgroundColor: getTierColor(cafe.ratingContext) }]}>
                <Text style={styles.ratedPinScore}>{cafe.topRating.toFixed(1)}</Text>
              </View>
              <View style={[styles.pinArrow, { borderTopColor: getTierColor(cafe.ratingContext) }]} />
            </View>
          </Marker>
        ))}

        {/* Nearby unvisited cafe pins */}
        {showNearby && nearbyCafes.map(cafe => (
          <Marker
            key={`nearby-${cafe.placeId}`}
            coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
            onPress={() => handleNearbyPinPress(cafe)}
          >
            <View style={styles.nearbyPinContainer}>
              <View style={styles.nearbyPin}>
                <Ionicons name="cafe" size={14} color="#666" />
              </View>
              <View style={[styles.pinArrow, { borderTopColor: '#E0E0E0' }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Filter chips overlay */}
      <View style={styles.filterOverlay}>
        {(['all', 'mine', 'nearby'] as FilterMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.filterChip, filter === mode && styles.filterChipActive]}
            onPress={() => {
              setFilter(mode);
              Haptics.selectionAsync();
              hideCard();
            }}
          >
            <Ionicons
              name={mode === 'all' ? 'layers' : mode === 'mine' ? 'star' : 'compass'}
              size={14}
              color={filter === mode ? '#FFF' : '#666'}
            />
            <Text style={[styles.filterText, filter === mode && styles.filterTextActive]}>
              {mode === 'all' ? 'All' : mode === 'mine' ? 'My Cafes' : 'Nearby'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Re-center FAB */}
      <TouchableOpacity style={styles.recenterButton} onPress={recenter}>
        <Ionicons name="locate" size={22} color="#8B4513" />
      </TouchableOpacity>

      {/* Bottom card */}
      {selectedCafe && (
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <TouchableOpacity style={styles.cardClose} onPress={hideCard}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.cardContent}>
            {/* Cafe icon */}
            <View style={[
              styles.cardIcon,
              { backgroundColor: selectedIsRated ? getTierColor((selectedCafe as RatedCafe).ratingContext) + '15' : '#F0EDE8' },
            ]}>
              <Ionicons
                name="cafe"
                size={24}
                color={selectedIsRated ? getTierColor((selectedCafe as RatedCafe).ratingContext) : '#999'}
              />
            </View>

            {/* Cafe info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{selectedCafe.name}</Text>
              <Text style={styles.cardAddress} numberOfLines={1}>{selectedCafe.address}</Text>

              {selectedIsRated && (
                <View style={styles.cardRatingRow}>
                  <View style={[
                    styles.cardRatingBadge,
                    { backgroundColor: getTierColor((selectedCafe as RatedCafe).ratingContext) },
                  ]}>
                    <Text style={styles.cardRatingText}>
                      {(selectedCafe as RatedCafe).topRating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.cardDrinkName}>
                    {(selectedCafe as RatedCafe).topDrink}
                  </Text>
                  <View style={[
                    styles.cardTierBadge,
                    { backgroundColor: getTierColor((selectedCafe as RatedCafe).ratingContext) + '15' },
                  ]}>
                    <Text style={[
                      styles.cardTierText,
                      { color: getTierColor((selectedCafe as RatedCafe).ratingContext) },
                    ]}>
                      {getTierLabel((selectedCafe as RatedCafe).ratingContext)}
                    </Text>
                  </View>
                </View>
              )}

              {!selectedIsRated && (
                <Text style={styles.cardUnvisited}>Not yet visited</Text>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F3',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },

  // Rated pins
  ratedPinContainer: {
    alignItems: 'center',
  },
  ratedPin: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  ratedPinScore: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Nearby pins
  nearbyPinContainer: {
    alignItems: 'center',
  },
  nearbyPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter overlay
  filterOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: '#8B4513',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },

  // Re-center
  recenterButton: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // Bottom card
  card: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    marginBottom: 8,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardRatingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardRatingText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cardDrinkName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  cardTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardTierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardUnvisited: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default Maps;
