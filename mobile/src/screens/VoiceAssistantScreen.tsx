import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { ThemeColors } from '../theme/colors';
import { MicIcon, XIcon } from '../components/Icons';
import Tts from 'react-native-tts';

interface VoiceAssistantScreenProps {
  user: {
    id: number;
    username: string;
    voice_clone_id?: string | null;
  };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
  onOpenHistory?: () => void;
}

export const VoiceAssistantScreen = ({ user, theme, baseUrl, onBack, onOpenHistory }: VoiceAssistantScreenProps) => {
  const [isAutoChat, setIsAutoChat] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [aiResponse, setAiResponse] = useState<string>('Nova is ready to talk...');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const isComponentMounted = useRef(true);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Colors based on state
  const getOrbColor = () => {
    switch (status) {
      case 'listening': return theme.success;
      case 'processing': return theme.primaryHover;
      case 'speaking': return theme.primary;
      default: return theme.primary;
    }
  };

  // Initialize conversation ID & Voice listeners using useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      isComponentMounted.current = true;
      Tts.getInitStatus().then(async () => {
        try {
          await Tts.setDefaultLanguage('en-US');
        } catch (err) {
          console.log('TTS Language en-US not supported, falling back to default', err);
        }
        try {
          await Tts.setDefaultRate(0.5);
        } catch (err) {
          console.log('TTS Rate error', err);
        }
      }).catch((err) => {
        console.log('TTS Engine init error:', err);
      });

      // Voice sessions will now always start a new conversation explicitly.

      Voice.onSpeechStart = () => console.log('Speech started');
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechEnd = () => console.log('Speech ended');
      Voice.onSpeechVolumeChanged = (e: any) => {
        if (isComponentMounted.current && e.value) {
          setVolume(Math.min(10, Math.max(0, e.value)));
        }
      };

      const onTtsFinish = () => {
        if (!isComponentMounted.current) return;
        setStatus('idle');
        if (isAutoChat) {
          setTimeout(() => {
            if (isComponentMounted.current) startListening();
          }, 600);
        }
      };
      const finishListener = Tts.addListener('tts-finish', onTtsFinish);

      return () => {
        isComponentMounted.current = false;
        setStatus('idle');
        setVolume(0);
        Tts.stop();
        finishListener.remove();
        Voice.cancel().then(() => {
          Voice.destroy().then(Voice.removeAllListeners);
        }).catch(() => {
          Voice.destroy().then(Voice.removeAllListeners);
        });
      };
    }, [user.id, baseUrl, isAutoChat])
  );

  const speakWithElevenLabs = async (text: string) => {
    Tts.stop();
    Tts.speak(text);
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Nova needs access to your microphone for voice chat.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const onSpeechResults = async (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const text = e.value[0];
      await Voice.stop();
      let command = text;
      const lowerText = text.toLowerCase().trim();

      if (lowerText.startsWith('nova')) {
        command = text.replace(/nova/i, '').trim();
        if (command.length === 0) {
          setStatus('speaking');
          const greeting = "Yes? I'm listening.";
          setAiResponse(greeting);
          speakWithElevenLabs(greeting);
          return;
        }
      }
      handleProcessVoice(command);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.log('onSpeechError:', e.error);
    const errorMsg = e.error?.message || '';
    const isMinorError = errorMsg.includes('No match') || errorMsg.includes('7') || errorMsg.includes('No speech') || errorMsg.includes('6');

    if (statusRef.current === 'listening') {
      setStatus('idle');
      if (!isMinorError) setAiResponse('I had a slight hearing problem. Let\'s try again.');

      if (isAutoChat && isComponentMounted.current) {
        setTimeout(() => {
          if (isComponentMounted.current && statusRef.current === 'idle') startListening();
        }, 800);
      }
    }
  };

  const startListening = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setAiResponse('Microphone permission denied.');
      return;
    }

    try {
      Tts.stop();
      await Voice.stop();
      await Voice.destroy();
      
      setStatus('listening');
      setAiResponse('Listening...');
      setTimeout(async () => {
        try {
          await Voice.start('en-US');
        } catch (err) {
          console.error('Voice.start error:', err);
          setStatus('idle');
        }
      }, 100);
    } catch (e) {
      console.error('startListening error:', e);
      setStatus('idle');
    }
  };

  const handleMicPress = async () => {
    if (status === 'speaking' || status === 'processing') {
      Tts.stop();
      await Voice.stop();
      setStatus('idle');
      setAiResponse('Nova is ready.');
      return;
    }

    if (status === 'idle') startListening();
    else if (status === 'listening') {
      try {
        await Voice.stop();
      } catch (e) {
        console.error(e);
        setStatus('idle');
      }
    }
  };

  const handleProcessVoice = async (transcribedText: string) => {
    if (!isComponentMounted.current) return;
    setStatus('processing');
    setAiResponse(`"${transcribedText}"\n\nSending to Python AI...`);

    try {
        // Dynamically connect using the provided baseUrl to support physical devices
        const wsUrl = baseUrl.replace('http', 'ws').replace(':5000', ':8000') + '/ws/voice';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to Python Voice Engine');
            // Sending the transcribed text over WebSocket
            ws.send(transcribedText);
        };

        ws.onmessage = (e) => {
            // Check if the server sent a text message (JSON)
            if (typeof e.data === 'string') {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'text') {
                        // Display the AI response on the screen!
                        setStatus('speaking');
                        setAiResponse(data.content);
                        // Speak the response using the phone's built-in voice
                        speakWithElevenLabs(data.content); 
                    } else if (data.type === 'status' && data.message === 'response_complete') {
                        // The stream is finished
                    }
                } catch (err) {
                    console.log("Error parsing JSON:", err);
                }
            } else {
                // This is the binary ElevenLabs audio chunk.
                // We ignore it for now since playing raw MP3 streams requires native audio libraries.
            }
        };

        ws.onerror = (e) => {
            console.log("WebSocket Error:", e.message);
            setStatus('speaking');
            setAiResponse('Failed to connect to Python WebSocket engine.');
            speakWithElevenLabs('Failed to connect to Python WebSocket engine.');
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed.");
        };

    } catch (error: any) {
      console.log('WebSocket Connection Error:', error);
      setStatus('speaking');
      setAiResponse("Connection error.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        {/* Absolutely centered title so it doesn't affect flex layout of buttons */}
        {/* <View style={{ position: 'absolute', left: 0, right: 0, top: Platform.OS === 'ios' ? 60 : 40, bottom: 16, justifyContent: 'center', alignItems: 'center', zIndex: 0 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Nova AI</Text>
        </View> */}

        <View style={{ alignItems: 'flex-start', zIndex: 1 }}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 }}>
          {onOpenHistory && (
            <TouchableOpacity onPress={onOpenHistory} style={[styles.autoChatToggle, { borderColor: theme.border, marginRight: 8 }]}>
              <Text style={[styles.autoChatText, { color: theme.textSecondary }]}>History</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setIsAutoChat(!isAutoChat)} 
            style={[styles.autoChatToggle, { backgroundColor: isAutoChat ? theme.primary + '20' : 'transparent', borderColor: theme.border }]}
          >
            <Text style={[styles.autoChatText, { color: isAutoChat ? theme.primary : theme.textSecondary }]}>
              {isAutoChat ? 'Auto: ON' : 'Auto: OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.orbContainer}>
          {/* Animated Glow Layers */}
          <MotiView
            animate={{ 
              scale: status === 'listening' ? [1.4, 1.5, 1.4] : status === 'speaking' ? [1.2, 1.3, 1.2] : [0.9, 1.0, 0.9],
              opacity: status === 'idle' ? [0.2, 0.4, 0.2] : 0.6,
            }}
            transition={{
              type: 'timing',
              duration: status === 'listening' ? 1000 : status === 'speaking' ? 400 : 3000,
              loop: true,
            }}
            style={[styles.orbGlow, { backgroundColor: getOrbColor() }]}
          />
          
          <TouchableOpacity activeOpacity={0.9} onPress={handleMicPress} style={styles.orbTouchArea}>
            <MotiView 
              animate={{ 
                scale: status === 'listening' ? 1.1 + (volume / 20) : status === 'idle' ? [1, 1.03, 1] : 1,
                translateY: status === 'idle' ? [-5, 5, -5] : 0,
                backgroundColor: getOrbColor(),
              }}
              transition={{
                scale: status === 'idle' ? { type: 'timing', duration: 4000, loop: true } : { type: 'spring' },
                translateY: { type: 'timing', duration: 5000, loop: true },
              }}
              style={[styles.orbCore, { borderColor: theme.card }]}
            >
              {status === 'idle' && <MicIcon color="#FFF" size={40} />}
              {status === 'processing' && <ActivityIndicator size="large" color="#FFF" />}
              {status === 'listening' && (
                <>
                  <MotiView
                    from={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2.0, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1500, loop: true }}
                    style={styles.listeningRipple}
                  />
                  <MotiView
                    from={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1500, loop: true, delay: 400 }}
                    style={styles.listeningRipple}
                  />
                  <MotiView
                    from={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1500, loop: true, delay: 800 }}
                    style={styles.listeningRipple}
                  />
                </>
              )}
              {status === 'speaking' && (
                <View style={styles.equalizerContainer}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <MotiView 
                      key={i}
                      from={{ height: 10 }}
                      animate={{ height: [10, 20 + i * 10, 10, 30 + i * 5, 10] }}
                      transition={{ type: 'timing', duration: 600 + (i * 150), loop: true }}
                      style={styles.speakingIndicator} 
                    />
                  ))}
                </View>
              )}
            </MotiView>
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <MotiText 
            key={status}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.statusText, { color: theme.textSecondary }]}
          >
            {status === 'idle' ? 'Ready to help' : status === 'listening' ? 'I\'m listening...' : status === 'processing' ? 'Thinking...' : 'Nova is speaking'}
          </MotiText>
        </View>

        <ScrollView 
          style={styles.responseScroll} 
          contentContainerStyle={styles.responseContainer} 
          showsVerticalScrollIndicator={false}
        >
          <AnimatePresence mode="wait">
            <MotiText
              key={aiResponse}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -20 }}
              transition={{ type: 'timing', duration: 600 }}
              style={[styles.responseText, { color: theme.text }]}
            >
              {aiResponse}
            </MotiText>
          </AnimatePresence>
        </ScrollView>
      </View>
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  autoChatToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  autoChatText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  orbContainer: {
    height: 320,
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  orbGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.3,
  },
  orbTouchArea: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 30,
    shadowColor: '#4F7CFF', // Tinted shadow
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  orbCore: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    overflow: 'hidden',
  },
  listeningRipple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  speakingIndicator: {
    width: 6,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 6,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
    height: 30,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  responseScroll: {
    flex: 1,
    width: '100%',
  },
  responseContainer: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  responseText: {
    fontSize: 24,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
});

