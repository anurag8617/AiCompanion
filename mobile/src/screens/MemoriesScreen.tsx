import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import { ThemeColors } from '../theme/colors';

interface Memory {
  id: number;
  content: string;
  category: string;
  created_at: string;
}

interface MemoriesScreenProps {
  user: { id: number; username: string };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
}

export const MemoriesScreen = ({ user, theme, baseUrl, onBack }: MemoriesScreenProps) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/memories/${user.id}`);
        if (response.data.status === 'success') {
          setMemories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch memories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, [user.id, baseUrl]);

  const renderItem = ({ item }: { item: Memory }) => (
    <View style={[styles.memoryCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.category, { color: theme.primary }]}>{item.category.toUpperCase()}</Text>
        </View>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.content, { color: theme.text }]}>{item.content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <View style={styles.backButton} />
        </View>
        <View style={{ flex: 2, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Memory Store</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🧠</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No memories extracted yet. Tell your AI some facts!</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1 
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  list: { padding: 20, paddingBottom: 110 },
  memoryCard: { 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    elevation: 4, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  category: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  content: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  date: { fontSize: 12, fontWeight: '600', opacity: 0.7 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, textAlign: 'center', fontWeight: '500', lineHeight: 24 },
});
