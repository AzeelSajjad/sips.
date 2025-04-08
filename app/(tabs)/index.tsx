import { Text, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text>Hello World</Text>
      <StatusBar style = "auto" />
    </SafeAreaView>
  );
}