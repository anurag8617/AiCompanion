import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { MotiView, AnimatePresence } from 'moti';
import { ThemeColors } from '../theme/colors';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
}

interface ChatScreenProps {
  user: {
    id: number;
    username: string;
  };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
}

export const ChatScreen = ({ user, theme, baseUrl, onBack }: ChatScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const convRes = await axios.get(`${baseUrl}/api/chat/conversations/${user.id}`);
        if (convRes.data.status === 'success' && convRes.data.conversations.length > 0) {
          const latestConvId = convRes.data.conversations[0].id;
          setConversationId(latestConvId);
          
          const msgRes = await axios.get(`${baseUrl}/api/chat/conversations/${latestConvId}/messages`);
          if (msgRes.data.status === 'success') {
            const history: Message[] = msgRes.data.messages.map((m: any) => ({
              id: m.id.toString(),
              sender: m.sender,
              content: m.content
            }));
            if (history.length > 0) {
              setMessages(history);
            } else {
              setMessages([{ id: 'initial-1', sender: 'ai', content: `Hello ${user.username}, I am your AI Companion. How can I help you today?` }]);
            }
          }
        } else {
          setMessages([{ id: 'initial-1', sender: 'ai', content: `Hello ${user.username}, I am your AI Companion. How can I help you today?` }]);
        }
      } catch (error) {
        console.log('Error fetching history:', error);
        setMessages([{ id: 'initial-1', sender: 'ai', content: `Hello ${user.username}, I am your AI Companion. How can I help you today?` }]);
      } finally {
        setIsFetchingHistory(false);
      }
    };

    fetchHistory();
  }, [user.id, baseUrl]);

  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    // Optimistically add user message to UI
    const newUserMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: trimmedText,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${baseUrl}/api/chat/message`, {
        userId: user.id,
        conversationId: conversationId,
        content: trimmedText,
      });

      if (response.data.status === 'success') {
        if (!conversationId) {
          setConversationId(response.data.conversationId);
        }

        const aiMsgData = response.data.message;
        const newAiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: aiMsgData.sender,
          content: aiMsgData.content,
        };

        setMessages((prev) => [...prev, newAiMsg]);
      }
    } catch (error: any) {
      console.log('Error sending message:', error);
      let errorMessage = 'Sorry, I encountered an error connecting to the server.';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: errorMessage,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isUser = item.sender === 'user';
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20, scale: 0.95 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={[
          styles.messageWrapper,
          isUser ? styles.messageWrapperUser : styles.messageWrapperAI,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: theme.primary, borderBottomRightRadius: 8 }
              : { backgroundColor: theme.card, borderBottomLeftRadius: 8, borderWidth: 1, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.messageText, { color: isUser ? '#FFF' : theme.text }]}>
            {item.content}
          </Text>
        </View>
      </MotiView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Nova Assistant</Text>
          <View style={styles.onlineStatus}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>Online</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Chat Area */}
      {isFetchingHistory ? (
        <View style={[styles.chatContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <MotiView 
        from={{ translateY: 50 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 200 }}
        style={[styles.inputContainer, { backgroundColor: theme.background }]}
      >
        <View style={[styles.pillInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Talk to Nova..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : theme.border }]}
            onPress={sendMessage}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={[styles.sendButtonText, { color: inputText.trim() ? '#FFF' : theme.textSecondary }]}>▶</Text>
            )}
          </TouchableOpacity>
        </View>
      </MotiView>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
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
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chatContent: {
    padding: 24,
    paddingBottom: 40,
  },
  messageWrapper: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAI: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 6,  
  },
  pillInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonText: {
    fontWeight: '900',
    fontSize: 18,
  },
});
