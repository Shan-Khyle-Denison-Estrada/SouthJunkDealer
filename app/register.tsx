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
} from "react-native";
import { useAuth } from "../context/AuthContext";

const { height } = Dimensions.get("window");

export default function Register() {
  const { signUp } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Separate confirm password from form data so it's not sent to DB
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
  });

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
    // 1. Basic Field Validation
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

    // 2. Password Match Validation
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
    <Text style={styles.label}>
      {text} {required && <Text style={styles.required}>*</Text>}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.splitLayout}>
        {/* LEFT HALF (Smaller width now) */}
        <View style={styles.leftPanel}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.mainLogo}
            />
            <Text style={styles.brandingText}>
              South Junk Dealer Management System
            </Text>
            <Text style={styles.tagline}>Secure • Reliable • Fast</Text>
          </View>
        </View>

        {/* RIGHT HALF (Wider width, No ScrollView) */}
        <View style={styles.rightPanel}>
          <View style={styles.contentWrapper}>
            <Text style={styles.headerTitle}>Initial System Setup</Text>
            <Text style={styles.headerSubtitle}>
              Create the owner account to begin.
            </Text>

            {/* CIRCULAR PHOTO UPLOAD */}
            <View style={styles.photoContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.photoWrapper}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Camera size={32} color="#888" />
                    <Text style={styles.photoText}>Add Photo</Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Pencil size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* FORM FIELDS */}
            <View style={styles.formGroup}>
              {/* ROW 1: NAMES (3 Columns) */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Label text="First Name" required />
                  <TextInput
                    placeholder="First Name"
                    style={styles.input}
                    onChangeText={(t) => setForm({ ...form, firstName: t })}
                  />
                </View>

                <View style={styles.col}>
                  <Label text="Middle Name" />
                  <TextInput
                    placeholder="Middle Name"
                    style={styles.input}
                    onChangeText={(t) => setForm({ ...form, middleName: t })}
                  />
                </View>

                <View style={styles.col}>
                  <Label text="Last Name" required />
                  <TextInput
                    placeholder="Last Name"
                    style={styles.input}
                    onChangeText={(t) => setForm({ ...form, lastName: t })}
                  />
                </View>
              </View>

              {/* ROW 2: Email */}
              <Label text="Email Address" required />
              <TextInput
                placeholder="Enter Email"
                style={styles.input}
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
                    secureTextEntry
                    style={styles.input}
                    onChangeText={(t) => setForm({ ...form, password: t })}
                  />
                </View>

                <View style={styles.col}>
                  <Label text="Confirm Password" required />
                  <TextInput
                    placeholder="Confirm Password"
                    secureTextEntry
                    style={styles.input}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Complete Setup</Text>
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
    backgroundColor: "#fff",
  },
  splitLayout: { flex: 1, flexDirection: "row" },

  // --- LEFT PANEL (Modified Flex) ---
  leftPanel: {
    flex: 1, // Takes 40% (approx)
    backgroundColor: "#F2C94C",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  logoContainer: { alignItems: "center", paddingHorizontal: 20 },
  mainLogo: {
    width: 250, // Slightly reduced to fit better
    height: 250,
    resizeMode: "contain",
    marginBottom: 0,
  },
  brandingText: {
    fontSize: 42, // Adjusted for balance
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    lineHeight: 50,
  },
  tagline: { fontSize: 16, color: "#fff", opacity: 0.9, marginTop: 5 },

  // --- RIGHT PANEL (Modified Flex) ---
  rightPanel: {
    flex: 1.5, // Takes 60% (approx) - Occupies more space
    backgroundColor: "#fff",
    justifyContent: "center", // Vertically Center content
  },
  contentWrapper: {
    padding: 50, // More padding since we have more space
    width: "100%",
    maxWidth: 800, // Limit max width on very large screens
    alignSelf: "center",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },

  photoContainer: { alignItems: "center", marginBottom: 30 },
  photoWrapper: {
    width: 100, // Slightly smaller to save vertical space
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  photo: { width: "100%", height: "100%", borderRadius: 50 },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  photoText: { fontSize: 10, color: "#888", marginTop: 4 },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#333",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  formGroup: { width: "100%" },

  // New Row Styles
  row: { flexDirection: "row", gap: 15 }, // Adds space between columns
  col: { flex: 1 }, // Equal width columns

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginLeft: 2,
  },
  required: {
    color: "red",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12, // Slightly tighter padding
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#333",
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
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
