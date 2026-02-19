import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

// Prefer EXPO_PUBLIC_API_URL so it works on device/emulator without code changes
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const SignUp = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = currentStep === 2;

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

  const validateCurrentStep = (): boolean => {
    if (currentStep === 0) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return false;
      }
      if (name.trim().length < 2) {
        setError("Name should be at least 2 characters long.");
        return false;
      }
    } else if (currentStep === 1) {
      if (!email.trim()) {
        setError("Please enter your email.");
        return false;
      }
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address.");
        return false;
      }
    } else if (currentStep === 2) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return false;
      }
      const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
      if (!hasLetterAndNumber) {
        setError("Password must contain at least one letter and one number.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (!isLastStep) {
      animateSlideChange(() =>
        setCurrentStep((prev) => Math.min(prev + 1, 2))
      );
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    animateSlideChange(() =>
      setCurrentStep((prev) => Math.max(prev - 1, 0))
    );
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/signup`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("authUser", JSON.stringify(user));
      await AsyncStorage.setItem("hasSeenOnboarding", "true");

      // Navigate to main app tabs (home)
      router.replace("/(root)/(tabs)/home");
    } catch (err: any) {
      console.error("Signup error:", err?.response ?? err);

      if (err?.response?.data?.errors) {
        // express-validator error structure
        const firstError = err.response.data.errors[0];
        setError(firstError?.msg ?? "Please check your details and try again.");
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignIn = () => {
    router.push("/(auth)/sign-in");
  };

  const handleViewOnboarding = () => {
    router.push({
      pathname: "/(auth)/welcome",
      params: { mode: "review" },
    } as any);
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <>
          <Text style={styles.stepTitle}>What's your name?</Text>
          <Text style={styles.stepSubtitle}>
            This is how your friends will see you on Sips.
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            autoCapitalize="words"
            style={styles.input}
            placeholderTextColor="#A0A0A0"
          />
        </>
      );
    }

    if (currentStep === 1) {
      return (
        <>
          <Text style={styles.stepTitle}>What's your email?</Text>
          <Text style={styles.stepSubtitle}>
            We'll use this to keep your account secure.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor="#A0A0A0"
          />
        </>
      );
    }

    // Step 2: password
    return (
      <>
        <Text style={styles.stepTitle}>Create a password</Text>
        <Text style={styles.stepSubtitle}>
          Use at least 8 characters with a mix of letters and numbers.
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="#A0A0A0"
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          secureTextEntry
          autoCapitalize="none"
          style={[styles.input, { marginTop: 12 }]}
          placeholderTextColor="#A0A0A0"
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top row: Back + View onboarding again */}
        <View style={styles.topRow}>
          {currentStep > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={18} color="#666666" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <TouchableOpacity
            style={styles.onboardingButton}
            onPress={handleViewOnboarding}
          >
            <Text style={styles.onboardingText}>View onboarding</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create your Sips account</Text>
          <Text style={styles.subtitle}>
            Just a few quick steps to start discovering and ranking drinks.
          </Text>
        </View>

        {/* Slide content */}
        <Animated.View
          style={[
            styles.stepContainer,
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
          {renderStepContent()}
        </Animated.View>

        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                step === currentStep && styles.progressDotActive,
                step < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Primary button */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLastStep ? "Sign Up" : "Next"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer: go to sign in */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleGoToSignIn}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 32,
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
  onboardingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  onboardingText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
  },
  stepContainer: {
    flex: 1,
    marginTop: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
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
  errorText: {
    color: "#B00020",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "left",
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#8B4513",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#555555",
  },
  footerLink: {
    color: "#8B4513",
    fontWeight: "600",
  },
});

export default SignUp;