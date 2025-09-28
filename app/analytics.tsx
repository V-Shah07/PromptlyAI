import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getAnalyticsData,
  getTagAnalytics,
  getTimeAnalytics,
} from "@/lib/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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


interface AnalyticsData {
 timeTracking: any[];
 eventTags: any[];
 totalTasks: number;
 completedTasks: number;
 totalEvents: number;
}


interface TimeAnalytics {
 totalEstimatedTime: string;
 totalActualTime: string;
 timeEfficiency: number;
 completedTasks: number;
 totalTasks: number;
 completionRate: number;
 averageEstimatedMinutes: number;
 averageActualMinutes: number;
}


interface TagAnalytics {
 allTags: { [key: string]: number };
 categories: { [key: string]: number };
 priorities: { [key: string]: number };
 totalUniqueTags: number;
 mostCommonTag: string;
 mostCommonCategory: string;
 mostCommonPriority: string;
}


export default function Analytics() {
 const colorScheme = useColorScheme();
 const colors = Colors[colorScheme ?? "light"];


 const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
   timeTracking: [],
   eventTags: [],
   totalTasks: 0,
   completedTasks: 0,
   totalEvents: 0,
 });
 const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics | null>(
   null
 );
 const [tagAnalytics, setTagAnalytics] = useState<TagAnalytics | null>(null);
 const [loading, setLoading] = useState(true);


 useEffect(() => {
   loadAnalyticsData();
 }, []);


 const loadAnalyticsData = async () => {
   try {
     setLoading(true);
     const currentUser = await GoogleSignin.getCurrentUser();
     if (!currentUser) {
       console.log("No user signed in");
       setLoading(false);
       return;
     }


     const userId = currentUser.user.id;
     const data = await getAnalyticsData(userId);
     setAnalyticsData(data);


     // Calculate time analytics
     const timeStats = getTimeAnalytics(data.timeTracking);


     // Override completion rate with correct calculation using all data
     const correctCompletionRate =
       data.totalTasks > 0
         ? Math.round((data.completedTasks / data.totalTasks) * 100)
         : 0;


     setTimeAnalytics({
       ...timeStats,
       completionRate: correctCompletionRate,
       completedTasks: data.completedTasks,
       totalTasks: data.totalTasks,
     });


     // Calculate tag analytics
     const tagStats = getTagAnalytics(data.eventTags);
     setTagAnalytics(tagStats);


     console.log("📊 Analytics loaded:", {
       timeStats,
       tagStats,
       totalTasks: data.totalTasks,
       completedTasks: data.completedTasks,
       totalEvents: data.totalEvents,
       correctCompletionRate,
     });
   } catch (error) {
     console.error("❌ Error loading analytics:", error);
   } finally {
     setLoading(false);
   }
 };


 const StatCard = ({
   title,
   value,
   subtitle,
   icon,
   color = "#8B5CF6",
 }: {
   title: string;
   value: string;
   subtitle?: string;
   icon: any;
   color?: string;
 }) => (
   <View style={[styles.statCard, { backgroundColor: colors.background }]}>
     <View style={styles.statHeader}>
       <IconSymbol name={icon} size={24} color={color} />
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


 const ProgressBar = ({
   percentage,
   color = "#8B5CF6",
   height = 8,
 }: {
   percentage: number;
   color?: string;
   height?: number;
 }) => (
   <View style={[styles.progressBarContainer, { height }]}>
     <View
       style={[
         styles.progressBar,
         {
           width: `${Math.min(percentage, 100)}%`,
           backgroundColor: color,
           height,
         },
       ]}
     />
   </View>
 );


 const CategoryChart = () => {
   if (!tagAnalytics || Object.keys(tagAnalytics.categories).length === 0) {
     return (
       <View
         style={[styles.chartCard, { backgroundColor: colors.background }]}
       >
         <Text style={[styles.chartTitle, { color: colors.text }]}>
           Category Distribution
         </Text>
         <Text style={[styles.noDataText, { color: colors.tabIconDefault }]}>
           No category data available
         </Text>
       </View>
     );
   }


   const maxCount = Math.max(...Object.values(tagAnalytics.categories));
   const categoryColors: { [key: string]: string } = {
     work: "#5A6ACF",
     academic: "#8B5CF6",
     social: "#AB47BC",
     extracurriculars: "#F59E0B",
     others: "#6B7280",
     health: "#FF8A65",
     fitness: "#10B981",
   };


   return (
     <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
       <Text style={[styles.chartTitle, { color: colors.text }]}>
         Category Distribution
       </Text>
       <View style={styles.categoryChart}>
         {Object.entries(tagAnalytics.categories).map(([category, count]) => {
           const percentage = (count / maxCount) * 100;
           return (
             <View key={category} style={styles.categoryBar}>
               <View style={styles.categoryBarInfo}>
                 <View
                   style={[
                     styles.categoryDot,
                     {
                       backgroundColor: categoryColors[category] || "#6B7280",
                     },
                   ]}
                 />
                 <Text style={[styles.categoryName, { color: colors.text }]}>
                   {category.charAt(0).toUpperCase() + category.slice(1)}
                 </Text>
                 <Text style={[styles.categoryCount, { color: colors.text }]}>
                   {count}
                 </Text>
               </View>
               <ProgressBar
                 percentage={percentage}
                 color={categoryColors[category] || "#6B7280"}
                 height={6}
               />
             </View>
           );
         })}
       </View>
     </View>
   );
 };


 const PriorityChart = () => {
   if (!tagAnalytics || Object.keys(tagAnalytics.priorities).length === 0) {
     return null;
   }


   const priorityColors: { [key: string]: string } = {
     high: "#EF4444",
     medium: "#F59E0B",
     low: "#10B981",
   };


   return (
     <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
       <Text style={[styles.chartTitle, { color: colors.text }]}>
         Priority Distribution
       </Text>
       <View style={styles.priorityGrid}>
         {Object.entries(tagAnalytics.priorities).map(([priority, count]) => (
           <View key={priority} style={styles.priorityItem}>
             <View
               style={[
                 styles.priorityDot,
                 { backgroundColor: priorityColors[priority] || "#6B7280" },
               ]}
             />
             <Text style={[styles.priorityLabel, { color: colors.text }]}>
               {priority.charAt(0).toUpperCase() + priority.slice(1)}
             </Text>
             <Text style={[styles.priorityCount, { color: colors.text }]}>
               {count}
             </Text>
           </View>
         ))}
       </View>
     </View>
   );
 };


 const TimeEfficiencyChart = () => {
   if (!timeAnalytics) return null;


   const efficiency = timeAnalytics.timeEfficiency;
   // Color scheme based on planning accuracy
   let efficiencyColor = "#6B7280"; // Default gray
   if (efficiency >= 120) {
     efficiencyColor = "#8B5CF6"; // Purple for over-planning
   } else if (efficiency >= 100) {
     efficiencyColor = "#10B981"; // Green for good over-planning
   } else if (efficiency >= 80) {
     efficiencyColor = "#10B981"; // Green for on track
   } else if (efficiency >= 60) {
     efficiencyColor = "#F59E0B"; // Orange for under-planning
   } else {
     efficiencyColor = "#EF4444"; // Red for significantly under-planning
   }


   // More descriptive efficiency text based on planning accuracy
   let efficiencyText = "";
   if (efficiency >= 120) {
     efficiencyText = "Over-planning (tasks take much less time)";
   } else if (efficiency >= 100) {
     efficiencyText = "Over-planning (tasks take less time)";
   } else if (efficiency >= 80) {
     efficiencyText = "On track (good planning)";
   } else if (efficiency >= 60) {
     efficiencyText = "Under-planning (tasks take more time)";
   } else {
     efficiencyText = "Significantly under-planning";
   }


   return (
     <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
       <Text style={[styles.chartTitle, { color: colors.text }]}>
         Time Efficiency
       </Text>
       <View style={styles.efficiencyContainer}>
         <View style={styles.efficiencyStats}>
           <Text style={[styles.efficiencyLabel, { color: colors.text }]}>
             Estimated: {timeAnalytics.totalEstimatedTime}
           </Text>
           <Text style={[styles.efficiencyLabel, { color: colors.text }]}>
             Actual: {timeAnalytics.totalActualTime}
           </Text>
         </View>
         <ProgressBar
           percentage={efficiency}
           color={efficiencyColor}
           height={12}
         />
         <Text style={[styles.efficiencyText, { color: efficiencyColor }]}>
           {efficiency}% - {efficiencyText}
         </Text>
       </View>
     </View>
   );
 };


 const generateInsights = () => {
   if (!timeAnalytics || !tagAnalytics) return [];


   const insights = [];


   // Time efficiency insights
   if (timeAnalytics.timeEfficiency > 120) {
     insights.push({
       icon: "exclamationmark.triangle",
       color: "#F59E0B",
       text: "You're consistently underestimating task duration. Consider adding 20% buffer time to estimates.",
     });
   } else if (timeAnalytics.timeEfficiency < 80) {
     insights.push({
       icon: "checkmark.circle",
       color: "#10B981",
       text: "Great time estimation skills! You're completing tasks faster than expected.",
     });
   }


   // Completion rate insights
   if (timeAnalytics.completionRate < 50) {
     insights.push({
       icon: "target",
       color: "#EF4444",
       text: `Only ${timeAnalytics.completionRate}% completion rate. Try breaking down large tasks into smaller ones.`,
     });
   } else if (timeAnalytics.completionRate > 80) {
     insights.push({
       icon: "star",
       color: "#10B981",
       text: `Excellent ${timeAnalytics.completionRate}% completion rate! You're very productive.`,
     });
   }


   // Category insights
   if (tagAnalytics.mostCommonCategory) {
     insights.push({
       icon: "tag",
       color: "#8B5CF6",
       text: `Most of your tasks are ${tagAnalytics.mostCommonCategory}-related. Consider diversifying your focus areas.`,
     });
   }


   // Priority insights
   if (
     tagAnalytics.priorities.high >
     tagAnalytics.priorities.medium + tagAnalytics.priorities.low
   ) {
     insights.push({
       icon: "exclamationmark.3",
       color: "#EF4444",
       text: "You have many high-priority tasks. Consider delegating or rescheduling some to reduce stress.",
     });
   }


   return insights;
 };


 if (loading) {
   return (
     <SafeAreaView
       style={[styles.container, { backgroundColor: colors.background }]}
     >
       <View style={styles.header}>
         <TouchableOpacity
           style={styles.backButton}
           onPress={() => router.push("/(tabs)")}
         >
           <IconSymbol name="chevron.left" size={24} color={colors.text} />
         </TouchableOpacity>
         <Text style={[styles.headerTitle, { color: colors.text }]}>
           Analytics
         </Text>
         <View style={styles.headerSpacer} />
       </View>
       <View style={styles.loadingContainer}>
         <Text style={[styles.loadingText, { color: colors.text }]}>
           Loading analytics...
         </Text>
       </View>
     </SafeAreaView>
   );
 }


 const insights = generateInsights();


 return (
   <SafeAreaView
     style={[styles.container, { backgroundColor: colors.background }]}
   >
     <View style={styles.header}>
       <TouchableOpacity
         style={styles.backButton}
         onPress={() => router.push("/(tabs)")}
       >
         <IconSymbol name="chevron.left" size={24} color={colors.text} />
       </TouchableOpacity>
       <Text style={[styles.headerTitle, { color: colors.text }]}>
         Analytics
       </Text>
       <View style={styles.headerSpacer} />
     </View>


     <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
       {/* Overview Stats */}
       <View style={styles.statsGrid}>
         <StatCard
           title="Completed Tasks"
           value={analyticsData.completedTasks.toString()}
           subtitle="All time"
           icon="checkmark.circle"
           color="#8B5CF6"
         />
         <StatCard
           title="Completion Rate"
           value={timeAnalytics ? `${timeAnalytics.completionRate}%` : "0%"}
           subtitle={`${analyticsData.completedTasks} of ${analyticsData.totalTasks} completed`}
           icon="chart.bar"
           color="#10B981"
         />
       </View>


       <View style={styles.statsGrid}>
         <StatCard
           title="Time Tracked"
           value={timeAnalytics?.totalActualTime || "0h 0m"}
           subtitle="Total actual time"
           icon="clock"
           color="#F59E0B"
         />
         <StatCard
           title="Efficiency"
           value={timeAnalytics ? `${timeAnalytics.timeEfficiency}%` : "0%"}
           subtitle="Actual vs Estimated"
           icon="gauge"
           color={
             timeAnalytics && timeAnalytics.timeEfficiency >= 100
               ? "#10B981"
               : "#EF4444"
           }
         />
       </View>


       {/* Time Efficiency Chart */}
       <TimeEfficiencyChart />


       {/* Category Distribution */}
       <CategoryChart />


       {/* Priority Distribution */}
       <PriorityChart />


       {/* Insights */}
       {insights.length > 0 && (
         <View
           style={[
             styles.insightsCard,
             { backgroundColor: colors.background },
           ]}
         >
           <Text style={[styles.insightsTitle, { color: colors.text }]}>
             Insights & Recommendations
           </Text>
           {insights.map((insight, index) => (
             <View key={index} style={styles.insightItem}>
               <IconSymbol
                 name={insight.icon as any}
                 size={20}
                 color={insight.color}
               />
               <Text style={[styles.insightText, { color: colors.text }]}>
                 {insight.text}
               </Text>
             </View>
           ))}
         </View>
       )}
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
 loadingContainer: {
   flex: 1,
   justifyContent: "center",
   alignItems: "center",
   padding: 40,
 },
 loadingText: {
   fontSize: 16,
   color: "#666",
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
 noDataText: {
   fontSize: 14,
   textAlign: "center",
   fontStyle: "italic",
   marginTop: 20,
 },
 categoryChart: {
   gap: 16,
 },
 categoryBar: {
   gap: 8,
 },
 categoryBarInfo: {
   flexDirection: "row",
   alignItems: "center",
   justifyContent: "space-between",
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
   flex: 1,
 },
 categoryCount: {
   fontSize: 16,
   fontWeight: "600",
 },
 progressBarContainer: {
   backgroundColor: "#F0F0F0",
   borderRadius: 4,
   overflow: "hidden",
 },
 progressBar: {
   borderRadius: 4,
 },
 priorityGrid: {
   flexDirection: "row",
   justifyContent: "space-around",
   gap: 16,
 },
 priorityItem: {
   alignItems: "center",
   flex: 1,
 },
 priorityDot: {
   width: 20,
   height: 20,
   borderRadius: 10,
   marginBottom: 8,
 },
 priorityLabel: {
   fontSize: 12,
   fontWeight: "500",
   marginBottom: 4,
 },
 priorityCount: {
   fontSize: 18,
   fontWeight: "700",
 },
 efficiencyContainer: {
   gap: 12,
 },
 efficiencyStats: {
   flexDirection: "row",
   justifyContent: "space-between",
 },
 efficiencyLabel: {
   fontSize: 14,
   fontWeight: "500",
 },
 efficiencyText: {
   fontSize: 16,
   fontWeight: "600",
   textAlign: "center",
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
   alignItems: "flex-start",
   marginBottom: 12,
 },
 insightText: {
   fontSize: 14,
   marginLeft: 12,
   flex: 1,
   lineHeight: 20,
 },
});



