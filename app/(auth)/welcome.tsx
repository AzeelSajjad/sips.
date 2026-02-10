import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

interface OnboardingSlide {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    title: "Welcome to Sips",
    description: "Discover, rate, and rank your favorite drinks at cafes near you",
    icon: "cafe",
    color: "#8B4513",
  },
  {
    title: "Find Your Perfect Cafe",
    description:
      "Search cafes by location and discover drinks they offer. Filter by matcha, boba, espresso, and more",
    icon: "map",
    color: "#D2691E",
  },
  {
    title: "Rank Drinks You Love",
    description:
      "Compare drinks head-to-head and build your personal ranking. Your preferences help others discover great drinks",
    icon: "trophy",
    color: "#CD853F",
  },
  {
    title: "Share with Friends",
    description:
      "Connect with friends, see their rankings, and discover new drinks together",
    icon: "people",
    color: "#A0522D",
  },
];

const OnBoarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  useEffect(() => {
    // Only auto-skip onboarding if user is not explicitly returning to review it
    if (params.mode !== "review") {
      checkOnboardingStatus();
    }
  }, [params.mode]);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      if (hasSeenOnboarding === "true") {
        // User has seen onboarding, redirect to sign-in
        router.replace("/(auth)/sign-in");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  const animateSlideChange = (onComplete: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      animateSlideChange(() => setCurrentIndex((prev) => prev + 1));
    } else {
      handleGetStarted();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      animateSlideChange(() => setCurrentIndex((prev) => prev - 1));
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
      }

      // Mark onboarding as complete
      await AsyncStorage.setItem("hasSeenOnboarding", "true");

      // Navigate to sign-up
      router.replace("/(auth)/sign-up");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.replace("/(auth)/sign-up");
    }
  };

  const handleSignIn = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error:", error);
      router.replace("/(auth)/sign-in");
    }
  };

  const currentSlide = onboardingSlides[currentIndex];
  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top controls: Back (when not first) + Skip (when not last) */}
        <View style={styles.topRow}>
          {currentIndex > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={18} color="#666666" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          {!isLastSlide && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main content */}
        <Animated.View
          style={[
            styles.slideContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${currentSlide.color}20` },
            ]}
          >
            <Ionicons
              name={currentSlide.icon}
              size={80}
              color={currentSlide.color}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{currentSlide.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{currentSlide.description}</Text>
        </Animated.View>

        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentIndex && styles.progressDotActive,
                index < currentIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {isLastSlide ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleGetStarted}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSignIn}
              >
                <Text style={styles.secondaryButtonText}>
                  Already have an account?
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
    marginLeft: 4,
  },
  backPlaceholder: {
    width: 70,
    height: 32,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: "#8B4513",
  },
  progressDotCompleted: {
    backgroundColor: "#8B4513",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: "#8B4513",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default OnBoarding;
