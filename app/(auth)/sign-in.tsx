import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Prefer EXPO_PUBLIC_API_URL so it works on device/emulator without code changes
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const SignIn = () => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email/username and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/login`, {
        identifier: identifier.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;

      // Persist auth data for later API calls
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("authUser", JSON.stringify(user));
      await AsyncStorage.setItem("hasSeenOnboarding", "true");

      // Navigate to main app tabs (home)
      router.replace("/(root)/(tabs)/home");
    } catch (err: any) {
      console.error("Login error:", err?.response ?? err);

      if (err?.response?.status === 401) {
        setError("Invalid credentials. Please check your email/username and password.");
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  const handleViewOnboarding = async () => {
    // Don't change the stored flag; just explicitly navigate in "review" mode
    router.push({
      pathname: "/(auth)/welcome",
      params: { mode: "review" },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back to Sips</Text>
          <Text style={styles.subtitle}>
            Sign in to discover, rank, and share your favorite drinks.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email or Username</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com or username"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#A0A0A0"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor="#A0A0A0"
          />

          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleGoToSignUp}>
            <Text style={styles.footerText}>
              Don't have an account? <Text style={styles.footerLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewOnboarding} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>View onboarding again</Text>
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
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666666",
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: "#444444",
    marginBottom: 6,
    fontWeight: "500",
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
  errorText: {
    marginTop: 12,
    color: "#B00020",
    fontSize: 14,
  },
  button: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#555555",
  },
  footerLink: {
    color: "#8B4513",
    fontWeight: "600",
  },
  secondaryAction: {
    paddingVertical: 6,
  },
  secondaryActionText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
});

export default SignIn;