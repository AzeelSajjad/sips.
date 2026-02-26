import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import axios from 'axios';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface CafeResult {
  name: string;
  address: string;
  placeId: string;
  latitude: number;
  longitude: number;
}

interface DrinkTemplate {
  name: string;
  category: string;
  description: string;
}

type RatingContext = 'loved' | 'liked' | 'disliked' | null;
type Step = 'cafe' | 'drink' | 'rate';

// ─── Add Screen ─────────────────────────────────────────────────────────────────
const Add = () => {
  const router = useRouter();

  // Navigation state
  const [step, setStep] = useState<Step>('cafe');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 1: Cafe search
  const [cafeQuery, setCafeQuery] = useState('');
  const [cafeResults, setCafeResults] = useState<CafeResult[]>([]);
  const [cafeLoading, setCafeLoading] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<CafeResult | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  // Step 2: Drink selection
  const [drinkSearch, setDrinkSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [catalogDrinks, setCatalogDrinks] = useState<DrinkTemplate[]>([]);
  const [filteredDrinks, setFilteredDrinks] = useState<DrinkTemplate[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<DrinkTemplate | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Step 3: Rating
  const [ratingContext, setRatingContext] = useState<RatingContext>(null);
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getUserLocation();
    fetchCatalog();
  }, []);

  useEffect(() => {
    filterDrinks();
  }, [drinkSearch, activeCategory, catalogDrinks]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      if (geo) {
        setUserLocation(`${geo.city || geo.region}, ${geo.region}`);
      }
    } catch {
      // silently fail
    }
  };

  const fetchCatalog = async () => {
    try {
      setCatalogLoading(true);
      const res = await axios.get(`${API_URL}/drink/catalog`);
      setCatalogDrinks(res.data.drinks);
      setCategories(res.data.categories);
    } catch {
      // silently fail
    } finally {
      setCatalogLoading(false);
    }
  };

  const filterDrinks = useCallback(() => {
    let results = catalogDrinks;
    if (activeCategory) {
      results = results.filter(d => d.category === activeCategory);
    }
    if (drinkSearch.trim()) {
      const q = drinkSearch.toLowerCase();
      results = results.filter(
        d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
      );
    }
    setFilteredDrinks(results);
  }, [drinkSearch, activeCategory, catalogDrinks]);

  // ─── Step transitions ───────────────────────────────────────────────────────
  const animateToStep = (nextStep: Step) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'drink') {
      setSelectedCafe(null);
      animateToStep('cafe');
    } else if (step === 'rate') {
      setSelectedDrink(null);
      setRatingContext(null);
      animateToStep('drink');
    }
  };

  const resetAll = () => {
    setStep('cafe');
    setCafeQuery('');
    setCafeResults([]);
    setSelectedCafe(null);
    setDrinkSearch('');
    setActiveCategory(null);
    setSelectedDrink(null);
    setRatingContext(null);
    setPrice('');
    setSubmitSuccess(false);
    setSubmitError(null);
    fadeAnim.setValue(1);
  };

  // ─── Cafe search ────────────────────────────────────────────────────────────
  const searchCafes = async () => {
    if (!cafeQuery.trim()) return;
    Keyboard.dismiss();
    try {
      setCafeLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const loc = userLocation || 'New York, NY';
      const res = await axios.get(`${API_URL}/map/search`, {
        params: { name: cafeQuery.trim(), loc },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCafeResults(res.data);
      } else {
        setCafeResults([]);
      }
    } catch (err: any) {
      console.error('Cafe search error:', err?.response?.data || err?.message || err);
      setCafeResults([]);
    } finally {
      setCafeLoading(false);
    }
  };

  const selectCafe = (cafe: CafeResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCafe(cafe);
    animateToStep('drink');
  };

  // ─── Drink selection ────────────────────────────────────────────────────────
  const selectDrink = (drink: DrinkTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDrink(drink);
    animateToStep('rate');
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedCafe || !selectedDrink || !ratingContext) {
      Alert.alert('Debug', `Missing: cafe=${!!selectedCafe} drink=${!!selectedDrink} rating=${ratingContext}`);
      return;
    }
    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const token = await AsyncStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Add drink to cafe and initialize rating in one call
      await axios.post(
        `${API_URL}/drink`,
        {
          placeId: selectedCafe.placeId,
          cafeName: selectedCafe.name,
          cafeAddress: selectedCafe.address,
          latitude: selectedCafe.latitude,
          longitude: selectedCafe.longitude,
          drink: selectedDrink.name,
          category: selectedDrink.category,
          description: selectedDrink.description,
          price: price ? parseFloat(price) : 0,
          ratingContext,
        },
        { headers }
      );

      setSubmitSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Show success briefly, then navigate to home
      setTimeout(() => {
        resetAll();
        router.replace('/(root)/(tabs)/home');
      }, 1800);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Unknown error';
      Alert.alert('Submit Error', errMsg);
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      {step !== 'cafe' ? (
        <TouchableOpacity style={styles.headerButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButton} />
      )}
      <Text style={styles.headerTitle}>
        {step === 'cafe' ? 'Find a Cafe' : step === 'drink' ? 'Pick a Drink' : 'Rate It'}
      </Text>
      <TouchableOpacity style={styles.headerButton} onPress={resetAll}>
        <Ionicons name="close" size={24} color="#1A1A1A" />
      </TouchableOpacity>
    </View>
  );

  // ─── Step 1: Cafe Search ───────────────────────────────────────────────────
  const renderCafeStep = () => (
    <View style={styles.stepContainer}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a cafe..."
            placeholderTextColor="#999"
            value={cafeQuery}
            onChangeText={setCafeQuery}
            onSubmitEditing={searchCafes}
            returnKeyType="search"
            autoFocus
          />
          {cafeQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setCafeQuery(''); setCafeResults([]); }}>
              <Ionicons name="close-circle" size={20} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={searchCafes}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Location indicator */}
      {userLocation && (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#8B4513" />
          <Text style={styles.locationText}>Near {userLocation}</Text>
        </View>
      )}

      {/* Loading */}
      {cafeLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#8B4513" size="large" />
        </View>
      )}

      {/* Results */}
      {!cafeLoading && cafeResults.length > 0 && (
        <View style={styles.resultsList}>
          <Text style={styles.resultsLabel}>Results</Text>
          {cafeResults.map(cafe => (
            <TouchableOpacity
              key={cafe.placeId}
              style={styles.cafeCard}
              onPress={() => selectCafe(cafe)}
              activeOpacity={0.7}
            >
              <View style={styles.cafeIconContainer}>
                <Ionicons name="cafe" size={24} color="#8B4513" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cafeName}>{cafe.name}</Text>
                <Text style={styles.cafeAddress}>{cafe.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty state */}
      {!cafeLoading && cafeQuery.length > 0 && cafeResults.length === 0 && !cafeLoading && (
        <View style={styles.emptyState}>
          <Ionicons name="cafe-outline" size={48} color="#D4C5B0" />
          <Text style={styles.emptyTitle}>No cafes found</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      )}

      {/* Initial hint */}
      {cafeQuery.length === 0 && (
        <View style={styles.hintContainer}>
          <View style={styles.hintIcon}>
            <Ionicons name="search" size={40} color="#D4C5B0" />
          </View>
          <Text style={styles.hintTitle}>Search for a cafe</Text>
          <Text style={styles.hintSubtitle}>
            Find the cafe where you had your drink
          </Text>
        </View>
      )}
    </View>
  );

  // ─── Step 2: Drink Selection ───────────────────────────────────────────────
  const renderDrinkStep = () => (
    <View style={styles.stepContainer}>
      {/* Selected cafe banner */}
      {selectedCafe && (
        <View style={styles.selectedBanner}>
          <Ionicons name="cafe" size={18} color="#8B4513" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.bannerName}>{selectedCafe.name}</Text>
            <Text style={styles.bannerAddress}>{selectedCafe.address}</Text>
          </View>
        </View>
      )}

      {/* Drink search */}
      <View style={styles.drinkSearchBar}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.drinkSearchInput}
          placeholder="Search drinks..."
          placeholderTextColor="#999"
          value={drinkSearch}
          onChangeText={setDrinkSearch}
        />
        {drinkSearch.length > 0 && (
          <TouchableOpacity onPress={() => setDrinkSearch('')}>
            <Ionicons name="close-circle" size={18} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
          onPress={() => { setActiveCategory(null); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.categoryText, !activeCategory && styles.categoryTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
            onPress={() => {
              setActiveCategory(activeCategory === cat ? null : cat);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Drink list */}
      {catalogLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#8B4513" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredDrinks}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.drinkRow}
              onPress={() => selectDrink(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.drinkIcon, { backgroundColor: getCategoryColor(item.category) + '15' }]}>
                <Ionicons name={getCategoryIcon(item.category)} size={22} color={getCategoryColor(item.category)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drinkName}>{item.name}</Text>
                <Text style={styles.drinkDescription} numberOfLines={1}>{item.description}</Text>
              </View>
              <View style={styles.drinkCategoryBadge}>
                <Text style={styles.drinkCategoryText}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No drinks found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or category</Text>
            </View>
          }
        />
      )}
    </View>
  );

  // ─── Step 3: Rate ──────────────────────────────────────────────────────────
  const renderRateStep = () => {
    if (submitSuccess) {
      return (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
          </View>
          <Text style={styles.successTitle}>Drink Added!</Text>
          <Text style={styles.successSubtitle}>
            {selectedDrink?.name} at {selectedCafe?.name}
          </Text>
          <TouchableOpacity style={styles.successButton} onPress={resetAll}>
            <Text style={styles.successButtonText}>Add Another</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        {/* Selected items summary */}
        <View style={styles.rateSummary}>
          <View style={styles.rateSummaryIcon}>
            <Ionicons name="cafe" size={32} color="#8B4513" />
          </View>
          <Text style={styles.rateDrinkName}>{selectedDrink?.name}</Text>
          <Text style={styles.rateCafeName}>{selectedCafe?.name}</Text>
          <Text style={styles.rateCafeAddress}>{selectedCafe?.address}</Text>
        </View>

        {/* How was it? */}
        <Text style={styles.rateQuestion}>How was it?</Text>

        <View style={styles.ratingRow}>
          <RatingOption
            label="Loved it!"
            color="#4CAF50"
            icon="heart"
            selected={ratingContext === 'loved'}
            onPress={() => {
              setRatingContext('loved');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          />
          <RatingOption
            label="It was fine"
            color="#FFC107"
            icon="thumbs-up"
            selected={ratingContext === 'liked'}
            onPress={() => {
              setRatingContext('liked');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          />
          <RatingOption
            label="Didn't like it"
            color="#EF5350"
            icon="thumbs-down"
            selected={ratingContext === 'disliked'}
            onPress={() => {
              setRatingContext('disliked');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          />
        </View>

        {/* Price (optional) */}
        <Text style={styles.priceLabel}>Price (optional)</Text>
        <View style={styles.priceInputRow}>
          <Text style={styles.priceCurrency}>$</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0.00"
            placeholderTextColor="#CCC"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, (!ratingContext || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!ratingContext || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Drink</Text>
          )}
        </TouchableOpacity>

        {submitError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#EF5350" />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  };

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderHeader()}

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 'cafe' ? '33%' : step === 'drink' ? '66%' : '100%' }]} />
        </View>

        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          {step === 'cafe' && renderCafeStep()}
          {step === 'drink' && renderDrinkStep()}
          {step === 'rate' && renderRateStep()}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Rating Option Component ────────────────────────────────────────────────────
const RatingOption = ({
  label, color, icon, selected, onPress,
}: {
  label: string; color: string; icon: string; selected: boolean; onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.08 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.ratingOption,
          { transform: [{ scale: scaleAnim }] },
          selected && { borderColor: color, borderWidth: 2.5, backgroundColor: color + '12' },
        ]}
      >
        <View style={[styles.ratingCircle, { backgroundColor: selected ? color : color + '25' }]}>
          <Ionicons
            name={icon as any}
            size={24}
            color={selected ? '#FFF' : color}
          />
        </View>
        <Text style={[styles.ratingLabel, selected && { color, fontWeight: '700' }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Coffee: '#795548',
    Espresso: '#4E342E',
    Latte: '#A1887F',
    Matcha: '#4CAF50',
    Tea: '#FF9800',
    Boba: '#9C27B0',
    Smoothie: '#E91E63',
    Specialty: '#2196F3',
    Other: '#607D8B',
  };
  return colors[category] || '#607D8B';
};

const getCategoryIcon = (category: string): any => {
  const icons: Record<string, string> = {
    Coffee: 'cafe',
    Espresso: 'cafe',
    Latte: 'cafe',
    Matcha: 'leaf',
    Tea: 'leaf',
    Boba: 'water',
    Smoothie: 'nutrition',
    Specialty: 'sparkles',
    Other: 'ellipsis-horizontal',
  };
  return icons[category] || 'cafe';
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Progress bar
  progressBar: {
    height: 3,
    backgroundColor: '#EDE8E1',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#8B4513',
    borderRadius: 1.5,
  },

  // Step container
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
  searchButton: {
    backgroundColor: '#8B4513',
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingLeft: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },

  // Results
  resultsList: {
    marginTop: 20,
  },
  resultsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  cafeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cafeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#8B451312',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cafeAddress: {
    fontSize: 13,
    color: '#999',
    marginTop: 3,
  },

  // Hints & Empty
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  hintIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B451310',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  hintSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },

  // Selected cafe banner
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B451310',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bannerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bannerAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  // Drink search
  drinkSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  drinkSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 8,
  },

  // Category chips
  categoryScroll: {
    maxHeight: 42,
    marginBottom: 14,
  },
  categoryContent: {
    gap: 8,
    paddingRight: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E4E0',
  },
  categoryChipActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },

  // Drink rows
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  drinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drinkName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  drinkDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  drinkCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F5F2EE',
  },
  drinkCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B4513',
  },

  // Rate step
  rateSummary: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  rateSummaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#8B451310',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  rateDrinkName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  rateCafeName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  rateCafeAddress: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },

  // Rating question
  rateQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 32,
  },
  ratingOption: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: 100,
    borderWidth: 1.5,
    borderColor: '#EDE8E1',
  },
  ratingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },

  // Price
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    color: '#1A1A1A',
  },

  // Submit
  submitButton: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 28,
  },
  successButton: {
    backgroundColor: '#8B4513',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  successButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF5350',
    fontWeight: '500',
  },
});

export default Add;
