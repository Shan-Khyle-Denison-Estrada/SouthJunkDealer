import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={styles.message}
      >Edit app/aboutUs.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 20,
    fontWeight: "bold",
    borderColor: "blue",
    borderWidth: 2,
    padding: 10,
  },
})