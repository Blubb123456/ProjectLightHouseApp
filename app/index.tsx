import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
export default function Index() {
  return (
    <>
      <Stack.Screen options={{ title: "Image Picker" }} />
      <View style={styles.container}>
        <Text style={styles.title} />
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
});
