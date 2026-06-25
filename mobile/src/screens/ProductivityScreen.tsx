import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import axios from 'axios';
import { ThemeColors } from '../theme/colors';
import { CustomButton } from '../components/CustomButton';

interface ProductivityScreenProps {
  user: {
    id: number;
    username: string;
  };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
}

interface ProductivityLog {
  id: number;
  app_name: string;
  duration_minutes: number;
  log_date: string;
}

export const ProductivityScreen = ({ user, theme, baseUrl, onBack }: ProductivityScreenProps) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<ProductivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focusTime, setFocusTime] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/productivity_logs/${user.id}`);
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Fetch logs error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusMode && startTime) {
      interval = setInterval(() => {
        setFocusTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusMode, startTime]);

  const toggleFocusMode = async () => {
    if (!isFocusMode) {
      setIsFocusMode(true);
      setStartTime(Date.now());
      setFocusTime(0);
    } else {
      const duration = Math.ceil(focusTime / 60);
      setIsFocusMode(false);
      
      if (duration > 0) {
        try {
          await axios.post(`${baseUrl}/api/productivity_logs`, {
            userId: user.id,
            appName: 'Focus Session',
            durationMinutes: duration,
            logDate: new Date().toISOString().split('T')[0]
          });
          Alert.alert('Session Saved', `Great job! You focused for ${duration} minutes.`);
          fetchLogs();
        } catch (error) {
          console.error('Save log error:', error);
        }
      }
      setStartTime(null);
      setFocusTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalMinutesToday = logs
    .filter(log => log.log_date === new Date().toISOString().split('T')[0])
    .reduce((sum, log) => sum + log.duration_minutes, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Productivity</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchLogs} colors={[theme.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Focus Mode Card */}
        <View style={[styles.card, { backgroundColor: isFocusMode ? theme.primary : theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: isFocusMode ? '#FFF' : theme.text }]}>Focus Mode</Text>
          <Text style={[styles.cardDesc, { color: isFocusMode ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
            Silence distractions and enter deep work state.
          </Text>
          
          {isFocusMode && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { color: '#FFF' }]}>{formatTime(focusTime)}</Text>
              <Text style={[styles.timerLabel, { color: 'rgba(255,255,255,0.7)' }]}>DEEP FOCUS ACTIVE</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.focusButton, { backgroundColor: isFocusMode ? 'rgba(255,255,255,0.2)' : theme.primary }]}
            onPress={toggleFocusMode}
            activeOpacity={0.8}
          >
            <Text style={[styles.focusButtonText, { color: '#FFF' }]}>{isFocusMode ? 'End Session' : 'Start Focus'}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Summary */}
        <View style={[styles.statsRow, { marginBottom: 32 }]}>
          <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{totalMinutesToday}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Minutes Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.statValue, { color: theme.success }]}>{logs.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Sessions</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        </View>
        
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No deep work logged yet.</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={[styles.logItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
              <View>
                <Text style={[styles.logApp, { color: theme.text }]}>{log.app_name}</Text>
                <Text style={[styles.logDate, { color: theme.textSecondary }]}>{new Date(log.log_date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.durationBadge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.logDuration, { color: theme.primary }]}>{log.duration_minutes}m</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  focusButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  focusButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    opacity: 0.8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  logApp: {
    fontSize: 16,
    fontWeight: '800',
  },
  logDate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.7,
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logDuration: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
