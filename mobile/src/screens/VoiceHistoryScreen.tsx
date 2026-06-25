import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeColors } from '../theme/colors';

interface VoiceHistoryScreenProps {
  user: any;
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
  navigation: any;
}

export const VoiceHistoryScreen = ({ user, theme, baseUrl, onBack, navigation }: VoiceHistoryScreenProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/chat/conversations/${user.id}`);
      if (response.data.status === 'success') {
        // Filter out only the 'call' (Voice Session) platform chats
        const voiceSessions = response.data.conversations.filter((c: any) => c.platform === 'call');
        setHistory(voiceSessions);
      }
    } catch (error) {
      console.error('Fetch Voice History error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => navigation.navigate('VoiceSessionDetail', { conversationId: item.id, title: item.title })}
    >
      <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.date, { color: theme.textSecondary }]}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
      {item.summary && (
        <Text style={[styles.summary, { color: theme.textSecondary }]}>{item.summary}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Voice History</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No voice history found.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  backText: {
    fontSize: 24,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  list: {
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
  },
  summary: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
});
