import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { MotiView } from 'moti';
import { ThemeColors } from '../theme/colors';
import { XIcon } from '../components/Icons';

interface TasksScreenProps {
  user: {
    id: number;
    username: string;
  };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
}

export const TasksScreen = ({ user, theme, baseUrl, onBack }: TasksScreenProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/tasks/${user.id}`);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!title.trim()) return;
    try {
      await axios.post(`${baseUrl}/api/tasks`, {
        userId: user.id,
        title,
        description,
        dueDate: dueDate || null
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleToggleStatus = async (task: any) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      await axios.put(`${baseUrl}/api/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        status: newStatus
      });
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${baseUrl}/api/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={{ color: theme.primary, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>My Tasks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Add Task Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 10 }}>Add New Task</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Task Title..."
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Description (Optional)"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="YYYY-MM-DD HH:MM:SS (Optional)"
            placeholderTextColor={theme.textSecondary}
            value={dueDate}
            onChangeText={setDueDate}
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddTask}
          >
            <Text style={styles.addButtonText}>Save Task</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          tasks.map(task => (
            <MotiView
              key={task.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, { color: theme.text, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }]}>
                  {task.title}
                </Text>
                {task.description ? <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{task.description}</Text> : null}
                {task.due_date ? <Text style={{ color: theme.primary, marginTop: 8, fontSize: 12 }}>Due: {new Date(task.due_date).toLocaleString()}</Text> : null}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  onPress={() => handleToggleStatus(task)}
                  style={[styles.actionBtn, { backgroundColor: task.status === 'completed' ? theme.success : theme.border }]}
                >
                  <Text style={{ color: task.status === 'completed' ? '#FFF' : theme.text, fontSize: 12 }}>
                    {task.status === 'completed' ? 'Done' : 'Mark'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(task.id)} style={[styles.actionBtn, { backgroundColor: theme.error, marginLeft: 8 }]}>
                  <XIcon color="#FFF" size={14} />
                </TouchableOpacity>
              </View>
            </MotiView>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '800' },
  formContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  addButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
