import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export default function TaskDetails() {
  const params = useLocalSearchParams();
  const { task, time, duration, category, color } = params;

  // Sample subtasks - in a real app, these would come from your data store
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    { id: 1, title: 'Data analysis section', completed: false },
    { id: 2, title: 'Model results', completed: false },
    { id: 3, title: 'Conclusions and next steps', completed: false },
    { id: 4, title: 'Review and polish', completed: false },
  ]);

  const [timeTracking, setTimeTracking] = useState({
    estimated: duration as string || '2h',
    actual: '0m'
  });

  const toggleSubtask = (id: number) => {
    setSubtasks(prev => 
      prev.map(subtask => 
        subtask.id === id 
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    );
  };

  const completedSubtasks = subtasks.filter(st => st.completed).length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return '#5A6ACF';
      case 'health': return '#FF8A65';
      case 'social': return '#AB47BC';
      case 'personal': return '#4CAF50';
      default: return '#8B5CF6';
    }
  };

  const getPriorityColor = () => {
    return '#FF4444'; // High priority red
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Title */}
        <Text style={styles.taskTitle}>{task}</Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(category as string) }]}>
            <Text style={styles.categoryTagText}>{category}</Text>
          </View>
          <View style={[styles.priorityTag, { backgroundColor: getPriorityColor() }]}>
            <Text style={styles.priorityTagText}>high priority</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Complete the presentation slides for the machine learning project including data analysis, model results, and conclusions.
        </Text>

        {/* Time and Duration */}
        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeIcon}>⏱️</Text>
            <Text style={styles.timeLabel}>Duration: </Text>
            <Text style={styles.timeValue}>{duration}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeIcon}>📅</Text>
            <Text style={styles.timeLabel}>Time: </Text>
            <Text style={styles.timeValue}>{time}</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressCount}>{completedSubtasks}/{subtasks.length} subtasks</Text>
          </View>

          {/* Subtasks */}
          {subtasks.map((subtask) => (
            <TouchableOpacity
              key={subtask.id}
              style={styles.subtaskItem}
              onPress={() => toggleSubtask(subtask.id)}
            >
              <View style={[
                styles.subtaskCircle,
                subtask.completed && styles.subtaskCircleCompleted
              ]}>
                {subtask.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[
                styles.subtaskText,
                subtask.completed && styles.subtaskTextCompleted
              ]}>
                {subtask.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Now Button */}
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.startButtonText}>Start Now</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Add to Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Time Tracking */}
        <View style={styles.timeTrackingSection}>
          <Text style={styles.timeTrackingTitle}>Time Tracking</Text>
          <View style={styles.timeTrackingContainer}>
            <View style={styles.timeTrackingItem}>
              <Text style={styles.timeTrackingLabel}>Estimated</Text>
              <Text style={styles.timeTrackingValue}>{timeTracking.estimated}</Text>
            </View>
            <View style={styles.timeTrackingItem}>
              <Text style={styles.timeTrackingLabel}>Actual</Text>
              <Text style={styles.timeTrackingValue}>{timeTracking.actual}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 18,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 34,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryTagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityTagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 16,
    color: '#666',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressSection: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  progressCount: {
    fontSize: 16,
    color: '#666',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subtaskCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtaskText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  subtaskTextCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  startButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playIcon: {
    color: 'white',
    fontSize: 16,
    marginRight: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeTrackingSection: {
    marginBottom: 32,
  },
  timeTrackingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  timeTrackingContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  timeTrackingItem: {
    flex: 1,
  },
  timeTrackingLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  timeTrackingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
