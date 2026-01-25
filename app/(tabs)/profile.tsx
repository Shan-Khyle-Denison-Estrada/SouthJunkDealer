import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  Pencil,
  User as UserIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user, updateUser, signOut } = useAuth();

  // --- FORM STATE ---
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoUri, setPhotoUri] = useState(user?.photoUri || null);

  // --- MODAL STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error" | "info" | "confirm" | "loading";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    type: "info",
    title: "",
    message: "",
  });

  // Helper to show modal
  const showModal = (
    type: "success" | "error" | "info" | "confirm" | "loading",
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // 1. Check for Changes
    const hasNameChanged =
      firstName !== (user?.firstName || "") ||
      middleName !== (user?.middleName || "") ||
      lastName !== (user?.lastName || "");
    const hasEmailChanged = email !== (user?.email || "");
    const hasPhotoChanged = photoUri !== (user?.photoUri || null);
    const hasPasswordInput = password.length > 0;

    if (
      !hasNameChanged &&
      !hasEmailChanged &&
      !hasPhotoChanged &&
      !hasPasswordInput
    ) {
      showModal(
        "info",
        "No Changes",
        "You haven't made any changes to your profile.",
      );
      return;
    }

    // 2. Validation
    if (!firstName || !lastName || !email) {
      showModal(
        "error",
        "Missing Fields",
        "First Name, Last Name, and Email are required.",
      );
      return;
    }

    // 3. Password Match
    if (hasPasswordInput || confirmPassword) {
      if (password !== confirmPassword) {
        showModal("error", "Password Mismatch", "New passwords do not match.");
        return;
      }
    }

    try {
      const updates: any = { firstName, middleName, lastName, email, photoUri };
      if (password) updates.password = password;

      await updateUser(updates);
      setPassword("");
      setConfirmPassword("");

      showModal(
        "success",
        "Profile Updated",
        "Your changes have been saved successfully.",
      );
    } catch (e) {
      showModal(
        "error",
        "Update Failed",
        "Could not update profile. Email might be in use.",
      );
    }
  };

  const handleLogoutPress = () => {
    // 1. Trigger Confirmation Modal
    showModal(
      "confirm",
      "Log Out",
      "Are you sure you want to sign out?",
      performLogout, // Pass the actual logout function as callback
    );
  };

  const performLogout = () => {
    // 2. Switch to Loading Modal immediately
    showModal(
      "loading",
      "Logging Out...",
      "Please wait while we sign you out.",
    );

    // 3. Perform Sign Out with delay
    setTimeout(async () => {
      await signOut();
      setModalVisible(false);
      router.replace("/login");
    }, 1500);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const Label = ({ text }: { text: string }) => (
    <Text style={styles.label}>{text}</Text>
  );

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER: AVATAR */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <Camera size={40} color="#888" />
            )}
            <View style={styles.editIcon}>
              <Pencil size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userTitle}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userRole}>Administrator</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.sectionHeader}>
            <UserIcon size={16} color="#F2C94C" />
            <Text style={styles.sectionTitle}>Personal Details</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Label text="First Name" />
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Label text="Middle Name" />
              <TextInput
                value={middleName}
                onChangeText={setMiddleName}
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Label text="Last Name" />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />
            </View>
          </View>

          <Label text="Email Address" />
          <View style={styles.inputWithIcon}>
            <Mail size={18} color="#888" style={{ marginRight: 10 }} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={{ flex: 1 }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.sectionHeader, { marginTop: 10 }]}>
            <Lock size={16} color="#F2C94C" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Label text="New Password" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                placeholder="Leave blank to keep"
              />
            </View>
            <View style={styles.col}>
              <Label text="Confirm Password" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry
                placeholder="Confirm change"
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutPress}
            >
              <LogOut size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* CUSTOM MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            // Only close on background click if NOT loading
            if (modalConfig.type !== "loading") setModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* ICON */}
                <View
                  style={[
                    styles.modalIcon,
                    {
                      backgroundColor:
                        modalConfig.type === "success"
                          ? "#E7F9ED"
                          : modalConfig.type === "error"
                            ? "#FEECEE"
                            : modalConfig.type === "confirm"
                              ? "#FFF4E5"
                              : "#E6F0FF",
                    },
                  ]}
                >
                  {modalConfig.type === "success" && (
                    <CheckCircle2 size={32} color="#27AE60" />
                  )}
                  {modalConfig.type === "error" && (
                    <AlertCircle size={32} color="#EB5757" />
                  )}
                  {(modalConfig.type === "info" ||
                    modalConfig.type === "loading") && (
                    <AlertCircle size={32} color="#2F80ED" />
                  )}
                  {modalConfig.type === "confirm" && (
                    <HelpCircle size={32} color="#F2994A" />
                  )}
                </View>

                <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                <Text style={styles.modalMessage}>{modalConfig.message}</Text>

                {/* BUTTONS LOGIC */}
                {modalConfig.type === "confirm" ? (
                  <View style={styles.modalButtonRow}>
                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={[styles.modalButtonText, { color: "#666" }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    {/* Confirm Button */}
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={modalConfig.onConfirm}
                    >
                      <Text style={styles.modalButtonText}>Yes, Log Out</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Standard OK Button (Hidden if loading)
                  modalConfig.type !== "loading" && (
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        {
                          backgroundColor:
                            modalConfig.type === "success"
                              ? "#27AE60"
                              : modalConfig.type === "error"
                                ? "#EB5757"
                                : "#2F80ED",
                        },
                      ]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>OK</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },

  // Header Styles
  header: { alignItems: "center", marginBottom: 30, marginTop: 10 },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 50 },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#333",
    borderRadius: 15,
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  userRole: { fontSize: 14, color: "#888" },

  // Form Styles
  form: { flex: 1, gap: 15 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },

  // Action Buttons
  actionRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: "auto",
    marginBottom: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#F2C94C",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  logoutButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  // Standard Modal Button
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // Confirm Modal Buttons
  modalButtonRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  confirmButton: { flex: 1, backgroundColor: "#FF6B6B" },
});
