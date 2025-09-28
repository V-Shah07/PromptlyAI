import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Analytics() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Mock data - in a real app, this would come from your analytics service
  const analyticsData = {
    totalTasks: 24,
    completedTasks: 18,
    completionRate: 75,
    totalTimeTracked: "12h 30m",
    averageTaskDuration: "31m",
    mostProductiveDay: "Tuesday",
    mostCommonCategory: "Work",
    weeklyStats: [
      { day: "Mon", tasks: 4, completed: 3 },
      { day: "Tue", tasks: 6, completed: 6 },
      { day: "Wed", tasks: 3, completed: 2 },
      { day: "Thu", tasks: 5, completed: 4 },
      { day: "Fri", tasks: 4, completed: 3 },
      { day: "Sat", tasks: 2, completed: 0 },
      { day: "Sun", tasks: 0, completed: 0 },
    ],
    categoryBreakdown: [
      { category: "Work", count: 8, color: "#5A6ACF" },
      { category: "Academic", count: 6, color: "#8B5CF6" },
      { category: "Social", count: 4, color: "#AB47BC" },
      { category: "Health", count: 3, color: "#FF8A65" },
      { category: "Personal", count: 3, color: "#4CAF50" },
    ],
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.background }]}>
      <View style={styles.statHeader}>
        <IconSymbol name={icon} size={24} color="#8B5CF6" />
        <Text style={[styles.statTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: colors.tabIconDefault }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const WeeklyChart = () => (
    <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>
        Weekly Activity
      </Text>
      <View style={styles.chartContainer}>
        {analyticsData.weeklyStats.map((day, index) => {
          const height = day.tasks > 0 ? (day.completed / day.tasks) * 100 : 0;
          return (
            <View key={day.day} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${height}%`,
                    backgroundColor: height === 100 ? "#4CAF50" : "#8B5CF6",
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.tabIconDefault }]}>
                {day.day}
              </Text>
              <Text style={[styles.barValue, { color: colors.text }]}>
                {day.completed}/{day.tasks}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const CategoryBreakdown = () => (
    <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>
        Category Breakdown
      </Text>
      <View style={styles.categoryList}>
        {analyticsData.categoryBreakdown.map((item, index) => (
          <View key={item.category} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View
                style={[styles.categoryDot, { backgroundColor: item.color }]}
              />
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {item.category}
              </Text>
            </View>
            <Text style={[styles.categoryCount, { color: colors.text }]}>
              {item.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Analytics
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Tasks"
            value={analyticsData.totalTasks.toString()}
            subtitle="This week"
            icon="checkmark.circle"
          />
          <StatCard
            title="Completion Rate"
            value={`${analyticsData.completionRate}%`}
            subtitle={`${analyticsData.completedTasks} completed`}
            icon="chart.bar"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Time Tracked"
            value={analyticsData.totalTimeTracked}
            subtitle="This week"
            icon="clock"
          />
          <StatCard
            title="Avg Duration"
            value={analyticsData.averageTaskDuration}
            subtitle="Per task"
            icon="timer"
          />
        </View>

        <WeeklyChart />

        <CategoryBreakdown />

        <View
          style={[styles.insightsCard, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.insightsTitle, { color: colors.text }]}>
            Insights
          </Text>
          <View style={styles.insightItem}>
            <IconSymbol name="star.fill" size={20} color="#F59E0B" />
            <Text style={[styles.insightText, { color: colors.text }]}>
              Your most productive day is {analyticsData.mostProductiveDay}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <IconSymbol name="tag.fill" size={20} color="#8B5CF6" />
            <Text style={[styles.insightText, { color: colors.text }]}>
              {analyticsData.mostCommonCategory} tasks are your most common
            </Text>
          </View>
          <View style={styles.insightItem}>
            <IconSymbol name="arrow.up.right" size={20} color="#4CAF50" />
            <Text style={[styles.insightText, { color: colors.text }]}>
              You're on track to beat last week's productivity!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "#666",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  chartCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  bar: {
    width: "100%",
    minHeight: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  insightsCard: {
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
