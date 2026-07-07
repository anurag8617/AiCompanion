import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import axios from 'axios';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { ThemeColors } from '../theme/colors';
import { MicIcon } from '../components/Icons';

interface MeetingAssistantScreenProps {
  user: {
    id: number;
    username: string;
  };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
}

interface Meeting {
  id: number;
  title: string;
  summary: string;
  action_items: string;
  emotional_analysis: string;
  engagement_score: number;
  created_at: string;
}

export const MeetingAssistantScreen = ({ user, theme, baseUrl, onBack }: MeetingAssistantScreenProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsRecordingAnalyzing] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMeetings();
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/meetings/${user.id}`);
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error('Fetch meetings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setTranscript(prev => prev + ' ' + e.value![0]);
      // Restart listening for continuous recording
      if (isRecording) {
        Voice.start('en-US').catch(err => console.log('Restart error:', err));
      }
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.log('Meeting Speech Error:', e.error);
    if (isRecording) {
      Voice.start('en-US').catch(err => console.log('Retry error:', err));
    }
  };

  const startMeeting = async () => {
    try {
      setTranscript('');
      setStartTime(Date.now());
      setIsRecording(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopMeeting = async () => {
    setIsRecording(false);
    await Voice.stop();
    
    if (transcript.length < 20) {
      Alert.alert('Too Short', 'The meeting transcript is too short to analyze.');
      return;
    }

    Alert.prompt(
      'End Meeting',
      'Give this meeting a title:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Analyze', 
          onPress: (title) => analyzeMeeting(title || 'Untitled Meeting') 
        }
      ]
    );
  };

  const analyzeMeeting = async (title: string) => {
    setIsRecordingAnalyzing(true);
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      const response = await axios.post(`${baseUrl}/api/meetings/analyze`, {
        userId: user.id,
        title,
        transcript,
        durationSeconds: duration
      });

      if (response.data.status === 'success') {
        Alert.alert('Analysis Complete', 'Maaya has finished analyzing your meeting.');
        fetchMeetings();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', 'Something went wrong while analyzing the transcript.');
    } finally {
      setIsRecordingAnalyzing(false);
      setTranscript('');
      setStartTime(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Meeting Assistant</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Meeting Card */}
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {isRecording ? 'Recording...' : 'New Session'}
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
            Analyze conversation for insights, action items, and emotional intelligence.
          </Text>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <Animated.View style={[styles.pulseCircle, { backgroundColor: theme.error, transform: [{ scale: pulseAnim }] }]} />
              <Text style={{ color: theme.error, fontWeight: '800', marginLeft: 10, fontSize: 12, letterSpacing: 1 }}>ACTIVE CAPTURE</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isRecording ? theme.error : theme.primary }]}
            onPress={isRecording ? stopMeeting : startMeeting}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.actionButtonText}>{isRecording ? 'End & Analyze' : 'Begin Meeting'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {transcript.length > 0 && (
          <View style={[styles.transcriptPreview, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Stream</Text>
            <Text style={{ color: theme.textSecondary, fontWeight: '500', lineHeight: 20 }}>"{transcript.slice(-150)}..."</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32, marginBottom: 16 }]}>Past Meetings</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : meetings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No meeting history found.</Text>
          </View>
        ) : (
          meetings.map((meeting) => (
            <TouchableOpacity 
              key={meeting.id} 
              style={[styles.meetingItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
              onPress={() => {
                const items = JSON.parse(meeting.action_items || '[]');
                Alert.alert(
                  meeting.title,
                  `SUMMARY:\n${meeting.summary}\n\nACTION ITEMS:\n${items.join('\n')}\n\nTONE:\n${meeting.emotional_analysis}`,
                  [{ text: 'Close' }]
                );
              }}
            >
              <View style={styles.meetingHeader}>
                <Text style={[styles.meetingTitle, { color: theme.text }]}>{meeting.title}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: theme.success + '15' }]}>
                  <Text style={{ color: theme.success, fontSize: 10, fontWeight: '800' }}>{meeting.engagement_score}% ENGAGED</Text>
                </View>
              </View>
              <Text numberOfLines={2} style={[styles.meetingSummary, { color: theme.textSecondary }]}>{meeting.summary}</Text>
              <Text style={[styles.meetingDate, { color: theme.textSecondary }]}>{new Date(meeting.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
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
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1 
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  scrollContent: { padding: 24 },
  card: { 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 24, 
    elevation: 8, 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 16 
  },
  cardTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  cardDesc: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 24 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  pulseCircle: { width: 10, height: 10, borderRadius: 5 },
  actionButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 4 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  transcriptPreview: { 
    padding: 20, 
    borderRadius: 20, 
    elevation: 2, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 5 
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  meetingItem: { 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 4, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  meetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  meetingTitle: { fontSize: 17, fontWeight: '800' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  meetingSummary: { fontSize: 14, lineHeight: 20, fontWeight: '500', marginBottom: 12 },
  meetingDate: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, fontWeight: '600' },
});
