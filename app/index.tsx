import { Link } from "expo-router";
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
      <Text className="text-2xl text-blue-600 font-bold border-2 border-blue-600 p-2 text-center"
      >Edit app/index.tsx to edit this screen.</Text>
      <Link href="/aboutUs">Go to About Us page</Link>
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