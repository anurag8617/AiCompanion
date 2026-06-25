import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';
import axios from 'axios';
import { MotiView, AnimatePresence } from 'moti';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { themes } from './src/theme/colors';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { VoiceAssistantScreen } from './src/screens/VoiceAssistantScreen';
import { VoiceHistoryScreen } from './src/screens/VoiceHistoryScreen';
import { VoiceSessionDetailScreen } from './src/screens/VoiceSessionDetailScreen';
import { MemoriesScreen } from './src/screens/MemoriesScreen';
import { ProductivityScreen } from './src/screens/ProductivityScreen';
import { MeetingAssistantScreen } from './src/screens/MeetingAssistantScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { BriefingScreen } from './src/screens/BriefingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { HomeIcon, MessageIcon, MicIcon, BrainIcon, ProfileIcon } from './src/components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotificationListener, requestNotificationPermission } from './src/services/NotificationService';

interface User {
  id: number;
  username: string;
  email: string;
  voice_clone_id?: string | null;
  token?: string;
}

const Tab = createBottomTabNavigator();

const App = (): React.JSX.Element => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [user, setUser] = useState<User | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  
  const [briefing, setBriefing] = useState<string>('Generating your briefing...');
  const [briefingLoading, setBriefingLoading] = useState<boolean>(true);

  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [backendLoading, setBackendLoading] = useState<boolean>(true);

  // Force Dark Theme for Premium SaaS feel by default, but allow system/light overrides if explicitly set later
  const isDarkMode = themeMode === 'system' ? true : themeMode === 'dark'; 
  const activeTheme = isDarkMode ? themes.dark : themes.light;
  const BASE_URL = 'http://192.168.0.104:5000';

  const fetchBriefing = async (userId: number) => {
    setBriefingLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/briefing/${userId}`);
      setBriefing(response.data.briefing);
    } catch (error) {
      console.log('Briefing error:', error);
      setBriefing('No active briefing at the moment.');
    } finally {
      setBriefingLoading(false);
    }
  };

  const checkBackendSync = async () => {
    setBackendLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      if (response.data.status === 'OK') setBackendStatus('Connected to Backend');
      else setBackendStatus('Backend response error');
    } catch (error) {
      setBackendStatus('Cannot connect to Backend');
    } finally {
      setBackendLoading(false);
    }
  };

  useEffect(() => {
    checkBackendSync();
    const restoreSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userSession');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          fetchBriefing(parsedUser.id);
          if (parsedUser.token) axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
          if (typeof setupNotificationListener === 'function') setupNotificationListener(parsedUser.id, BASE_URL);
          if (typeof requestNotificationPermission === 'function') requestNotificationPermission();
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        setIsRestoringSession(false);
      }
    };
    restoreSession();
  }, []);

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    try {
      await AsyncStorage.removeItem('userSession');
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  };

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    fetchBriefing(loggedInUser.id);
    if (loggedInUser.token) axios.defaults.headers.common['Authorization'] = `Bearer ${loggedInUser.token}`;
    if (typeof setupNotificationListener === 'function') setupNotificationListener(loggedInUser.id, BASE_URL);
    if (typeof requestNotificationPermission === 'function') requestNotificationPermission();
    try {
      await AsyncStorage.setItem('userSession', JSON.stringify(loggedInUser));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  };

  const navTheme = {
    ...(isDarkMode ? NavigationDarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? NavigationDarkTheme.colors : DefaultTheme.colors),
      background: activeTheme.background,
      card: activeTheme.card,
      text: activeTheme.text,
      border: activeTheme.border,
      primary: activeTheme.primary,
    },
  };

  if (isRestoringSession) {
    return (
      <View style={{ flex: 1, backgroundColor: activeTheme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={activeTheme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={activeTheme.background} />
      <AnimatePresence mode="wait">
        {!user ? (
          <MotiView key="login" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1 }}>
            <LoginScreen theme={activeTheme} baseUrl={BASE_URL} onLoginSuccess={handleLoginSuccess} />
          </MotiView>
        ) : (
          <MotiView key="app" from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
            <NavigationContainer theme={navTheme}>
              <Tab.Navigator
                backBehavior="history"
                screenOptions={{
                  headerShown: false,
                  tabBarHideOnKeyboard: true,
                  tabBarStyle: {
                    backgroundColor: activeTheme.surface,
                    borderTopColor: activeTheme.border,
                    borderTopWidth: 1,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    height: Platform.OS === 'ios' ? 95 : 76,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
                    paddingTop: 12,
                  },
                  tabBarActiveTintColor: activeTheme.primary,
                  tabBarInactiveTintColor: activeTheme.textSecondary,
                  tabBarShowLabel: true,
                  tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
                }}
              >
                <Tab.Screen 
                  name="Home" 
                  options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} /> }}
                >
                  {(props) => (
                    <DashboardScreen
                      {...props}
                      user={user}
                      theme={activeTheme}
                      isDarkMode={isDarkMode}
                      onToggleTheme={handleToggleTheme}
                      onLogout={handleLogout}
                      backendStatus={backendStatus}
                      backendLoading={backendLoading}
                      onRefreshBackend={checkBackendSync}
                      onOpenChat={() => props.navigation.navigate('Chat')}
                      onOpenVoice={() => props.navigation.navigate('Voice')}
                      onOpenMemories={() => props.navigation.navigate('Memory')}
                      onOpenProductivity={() => props.navigation.navigate('Productivity')} 
                      onOpenMeeting={() => props.navigation.navigate('Meeting')} 
                      onOpenTasks={() => props.navigation.navigate('Tasks')}
                      onOpenContacts={() => props.navigation.navigate('Contacts')} 
                      onOpenBriefing={() => props.navigation.navigate('Briefing')} 
                      briefing={briefing}
                      briefingLoading={briefingLoading}
                      baseUrl={BASE_URL}
                    />
                  )}
                </Tab.Screen>
                
                <Tab.Screen 
                  name="Chat" 
                  options={{ tabBarIcon: ({ color }) => <MessageIcon color={color} size={22} /> }}
                >
                  {(props) => <ChatScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>
                
                <Tab.Screen 
                  name="Voice" 
                  options={{ tabBarIcon: ({ color }) => <MicIcon color={color} size={24} /> }}
                >
                  {(props) => <VoiceAssistantScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} onOpenHistory={() => props.navigation.navigate('VoiceHistory')} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="Memory" 
                  options={{ tabBarIcon: ({ color }) => <BrainIcon color={color} size={22} /> }}
                >
                  {(props) => <MemoriesScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="Profile" 
                  options={{ tabBarIcon: ({ color }) => <ProfileIcon color={color} size={22} /> }}
                >
                  {(props) => (
                    <ProfileScreen 
                      {...props} 
                      user={user} 
                      theme={activeTheme} 
                      onLogout={handleLogout} 
                      isDarkMode={isDarkMode} 
                      onToggleTheme={handleToggleTheme} 
                    />
                  )}
                </Tab.Screen>

                {/* HIDDEN TABS FOR NAVIGATION */}
                <Tab.Screen 
                  name="Productivity" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <ProductivityScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="Meeting" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <MeetingAssistantScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="VoiceHistory" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <VoiceHistoryScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="VoiceSessionDetail" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <VoiceSessionDetailScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="Tasks" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <TasksScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="Contacts" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <ContactsScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>

                <Tab.Screen 
                  name="Briefing" 
                  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
                >
                  {(props) => <BriefingScreen {...props} user={user} theme={activeTheme} baseUrl={BASE_URL} onBack={() => props.navigation.goBack()} />}
                </Tab.Screen>
              </Tab.Navigator>
            </NavigationContainer>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
};

export default App;
