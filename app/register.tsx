import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, Pencil } from "lucide-react-native";
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

export default function Register() {
  const { signUp } = useAuth();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // --- DYNAMIC THEME COLORS ---
  const theme = {
    // Layout Backgrounds
    containerBg: isDark ? "#000000" : "#ffffff",
    leftPanelBg: isDark ? "#121212" : "#F2C94C", // Dark : Brand Yellow
    rightPanelBg: isDark ? "#1E1E1E" : "#ffffff", // Dark Gray : White

    // Text
    textPrimary: isDark ? "#FFFFFF" : "#333333",
    textSecondary: isDark ? "#A1A1AA" : "#666666",
    textBranding: isDark ? "#F2C94C" : "#FFFFFF", // Yellow text in dark mode for contrast

    // Inputs
    inputBackground: isDark ? "#2C2C2C" : "#f9f9f9",
    inputBorder: isDark ? "#444444" : "#e0e0e0",
    inputText: isDark ? "#FFFFFF" : "#333333",
    placeholder: isDark ? "#888888" : "#999999",

    // Interactive
    buttonBg: isDark ? "#2563eb" : "#F2C94C", // Blue : Brand Yellow
    buttonText: "#ffffff",
    iconColor: isDark ? "#2563eb" : "#F2C94C",
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.password ||
      !confirmPassword
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (form.password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    const success = await signUp({ ...form, photoUri });

    if (success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Error", "Could not create account. Email might be in use.");
    }
  };

  const Label = ({
    text,
    required = false,
  }: {
    text: string;
    required?: boolean;
  }) => (
    <Text style={[styles.label, { color: theme.textPrimary }]}>
      {text} {required && <Text style={styles.required}>*</Text>}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.containerBg }]}
    >
      <View style={styles.splitLayout}>
        {/* LEFT HALF - Branding */}
        <View
          style={[styles.leftPanel, { backgroundColor: theme.leftPanelBg }]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.mainLogo}
            />
            <Text style={[styles.brandingText, { color: theme.textBranding }]}>
              South Junk Dealer Management System
            </Text>
            <Text
              style={[
                styles.tagline,
                { color: theme.textBranding, opacity: 0.8 },
              ]}
            >
              Secure • Reliable • Fast
            </Text>
          </View>
        </View>

        {/* RIGHT HALF - Content */}
        <View
          style={[styles.rightPanel, { backgroundColor: theme.rightPanelBg }]}
        >
          <View style={styles.contentWrapper}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Initial System Setup
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
            >
              Create the owner account to begin.
            </Text>

            {/* CIRCULAR PHOTO UPLOAD */}
            <View style={styles.photoContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  styles.photoWrapper,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Camera size={32} color={theme.placeholder} />
                    <Text
                      style={[styles.photoText, { color: theme.placeholder }]}
                    >
                      Add Photo
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.editBadge,
                    {
                      backgroundColor: theme.buttonBg,
                      borderColor: theme.rightPanelBg,
                    },
                  ]}
                >
                  <Pencil size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* FORM FIELDS */}
            <View style={styles.formGroup}>
              {/* ROW 1: NAMES */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Label text="First Name" required />
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor={theme.placeholder}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.inputText,
                      },
                    ]}
                    onChangeText={(t) => setForm({ ...form, firstName: t })}
                  />
                </View>

                <View style={styles.col}>
                  <Label text="Middle Name" />
                  <TextInput
                    placeholder="Middle Name"
                    placeholderTextColor={theme.placeholder}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.inputText,
                      },
                    ]}
                    onChangeText={(t) => setForm({ ...form, middleName: t })}
                  />
                </View>

                <View style={styles.col}>
                  <Label text="Last Name" required />
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor={theme.placeholder}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.inputText,
                      },
                    ]}
                    onChangeText={(t) => setForm({ ...form, lastName: t })}
                  />
                </View>
              </View>

              {/* ROW 2: Email */}
              <Label text="Email Address" required />
              <TextInput
                placeholder="Enter Email"
                placeholderTextColor={theme.placeholder}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(t) => setForm({ ...form, email: t })}
              />

              {/* ROW 3: Passwords */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Label text="Password" required />
                  <TextInput
                    placeholder="Enter Password"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.inputText,
                      },
                    ]}
                    onChangeText={(t) => setForm({ ...form, password: t })}
                  />
                </View>

                <View style={styles.col}>
                  <Label text="Confirm Password" required />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.inputText,
                      },
                    ]}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.buttonBg }]}
                onPress={handleRegister}
              >
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                  Complete Setup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height,
    flex: 1,
  },
  splitLayout: { flex: 1, flexDirection: "row" },

  // --- LEFT PANEL ---
  leftPanel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.1)", // Subtle border
  },
  logoContainer: { alignItems: "center", paddingHorizontal: 20 },
  mainLogo: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: 0,
  },
  brandingText: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 50,
  },
  tagline: { fontSize: 16, marginTop: 5 },

  // --- RIGHT PANEL ---
  rightPanel: {
    flex: 1.5,
    justifyContent: "center",
  },
  contentWrapper: {
    padding: 50,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center",
  },

  photoContainer: { alignItems: "center", marginBottom: 30 },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  photo: { width: "100%", height: "100%", borderRadius: 50 },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  photoText: { fontSize: 10, marginTop: 4 },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },

  formGroup: { width: "100%" },

  row: { flexDirection: "row", gap: 15 },
  col: { flex: 1 },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 2,
  },
  required: {
    color: "red",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: { fontWeight: "bold", fontSize: 16 },
});
