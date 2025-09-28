import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: Colors[colorScheme ?? "light"].tabIconDefault,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol name={focused ? "house.fill" : "house"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol name={focused ? "magnifyingglass.circle.fill" : "magnifyingglass.circle"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tts"
        options={{
          title: "TTS",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol name={focused ? "mic.fill" : "mic"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}