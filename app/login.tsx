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
} from "react-native";
import { useAuth } from "../context/AuthContext";

const { height } = Dimensions.get("window");

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {/* LOGO SECTION */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
          />
          <Text style={styles.appName}>South Junk Dealer</Text>
          <Text style={styles.tagline}>Management System</Text>
        </View>

        {/* LOGIN FORM */}
        <View style={styles.formContainer}>
          <Text style={styles.header}>Welcome Back</Text>
          <Text style={styles.subHeader}>Sign in to continue</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
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
    backgroundColor: "#F2C94C", // Main Brand Color
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
    color: "#fff",
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  // NEW STYLES
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
    backgroundColor: "#333",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 0, // Adjusted margin
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
