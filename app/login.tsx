import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const { height } = Dimensions.get("window");

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    // Container: Brand Yellow in Light, Dark Background in Dark
    containerBg: isDark ? "#121212" : "#F2C94C",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#333333",
    textSecondary: isDark ? "#A1A1AA" : "#666666",
    label: isDark ? "#D4D4D8" : "#333333",
    inputBg: isDark ? "#2C2C2C" : "#f9f9f9",
    inputBorder: isDark ? "#333333" : "#e0e0e0",
    inputText: isDark ? "#FFFFFF" : "#333333",
    placeholder: isDark ? "#888888" : "#999999",
    buttonBg: isDark ? "#2563eb" : "#333333", // Blue in dark mode for contrast
    buttonText: "#ffffff",
    logoText: "#ffffff", // Always white (contrast against Yellow or Black)
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    // 1. Attempt Sign In
    const success = await signIn(email, password);

    setIsSubmitting(false);

    if (success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Login Failed", "Invalid email or password.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.containerBg }]}
    >
      <View style={styles.contentContainer}>
        {/* LOGO SECTION */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: theme.logoText }]}>
            South Junk Dealer
          </Text>
          <Text style={[styles.tagline, { color: "rgba(255,255,255,0.8)" }]}>
            Management System
          </Text>
        </View>

        {/* LOGIN FORM */}
        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.header, { color: theme.textPrimary }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subHeader, { color: theme.textSecondary }]}>
            Sign in to continue
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.label }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.label }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={theme.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.buttonBg },
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color handled dynamically
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    // Color handled dynamically (though usually white for this layout)
  },
  tagline: {
    fontSize: 16,
    textAlign: "center",
    // Color handled dynamically
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    // Background color handled dynamically
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    // Color handled dynamically
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 25,
    textAlign: "center",
    // Color handled dynamically
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    // Color handled dynamically
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    // Colors handled dynamically
  },
  // NEW STYLES (Preserved)
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#F2C94C",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 0,
    // Background color handled dynamically
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
