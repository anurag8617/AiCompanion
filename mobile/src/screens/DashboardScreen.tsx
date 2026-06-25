import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import axios from 'axios';
import { MotiView, AnimatePresence } from 'moti';
import { ThemeColors } from '../theme/colors';
import { UserIcon, BrainIcon, MessageIcon, MicIcon, HomeIcon, TargetIcon, BriefcaseIcon } from '../components/Icons';
import { AuraCard } from '../components/AuraCard';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  user: {
    id: number;
    username: string;
    email: string;
    voice_clone_id?: string | null;
  };
  theme: ThemeColors;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  backendStatus: string;
  backendLoading: boolean;
  onRefreshBackend: () => void;
  onOpenChat: () => void;
  onOpenVoice: () => void;
  onOpenMemories: () => void;
  onOpenProductivity: () => void;
  onOpenMeeting: () => void;
  onOpenTasks?: () => void;
  onOpenContacts: () => void;
  onOpenBriefing: () => void;
  briefing: string;
  briefingLoading: boolean;
  baseUrl: string;
}

const OrbStatus = ({ status, theme }: { status: string, theme: ThemeColors }) => {
  const isOnline = status === 'Connected to Backend';
  return (
    <View style={styles.orbContainer}>
      <MotiView
        from={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ loop: true, duration: 2000, type: 'timing' }}
        style={[styles.orbPulse, { backgroundColor: isOnline ? theme.success : theme.error }]}
      />
      <View style={[styles.orbCore, { backgroundColor: isOnline ? theme.success : theme.error }]} />
    </View>
  );
};

const AssistantFaceCard = ({ onPress, theme, scrollY }: { onPress: () => void, theme: ThemeColors, scrollY: number }) => {
  const [isPressed, setIsPressed] = useState(false);

  // Calculate where the face is looking based on scroll position
  const lookOffset = Math.min(Math.max(scrollY / 15, -5), 10);

  return (
    <Pressable onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} onPress={onPress}>
      <MotiView 
        animate={{ scale: isPressed ? 0.95 : 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={[styles.faceCard, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
      >
        <MotiView
           animate={{ translateY: [-3, 3, -3] }}
           transition={{ loop: true, type: 'timing', duration: 4000 }}
           style={styles.faceInner}
        >
          <View style={styles.faceContainer}>
            <View style={styles.faceInnerFeatures}>
              <MotiView 
                animate={{ translateY: -lookOffset }} 
                transition={{ type: 'spring', damping: 20 }}
                style={styles.eyesRow}
              >
                <View style={styles.eyeWrapper}>
                  <MotiView 
                    animate={{ height: [14, 2, 14, 14, 14, 14, 14] }} 
                    transition={{ loop: true, type: 'timing', duration: 3500 }} 
                    style={styles.eye} 
                  />
                </View>
                <View style={styles.eyeWrapper}>
                  <MotiView 
                    animate={{ height: [14, 2, 14, 14, 14, 14, 14] }} 
                    transition={{ loop: true, type: 'timing', duration: 3500 }} 
                    style={styles.eye} 
                  />
                </View>
              </MotiView>
              <MotiView 
                animate={{ width: [16, 30, 16], height: [6, 12, 6], borderRadius: [3, 6, 3] }}
                transition={{ loop: true, type: 'timing', duration: 2000 }}
                style={styles.mouth}
              />
            </View>
          </View>
          <View style={styles.faceTextContainer}>
            <Text style={styles.faceTitle}>Nova Voice</Text>
            <Text style={styles.faceSubtitle}>Tap to speak with your assistant</Text>
          </View>
        </MotiView>
      </MotiView>
    </Pressable>
  );
};

export const DashboardScreen = ({
  user,
  theme,
  isDarkMode,
  onToggleTheme,
  onLogout,
  backendStatus,
  backendLoading,
  onRefreshBackend,
  onOpenChat,
  onOpenVoice,
  onOpenMemories,
  onOpenProductivity,
  onOpenMeeting,
  onOpenTasks,
  onOpenContacts,
  onOpenBriefing,
  briefing,
  briefingLoading,
  baseUrl,
}: DashboardScreenProps) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState({ memories: 12, meetings: 2, focus: 94 });
  const scrollYAnim = useRef(new Animated.Value(0)).current;
  const [scrollYState, setScrollYState] = useState(0);

  useEffect(() => {
    const listenerId = scrollYAnim.addListener(({ value }) => {
      setScrollYState(value);
    });
    return () => scrollYAnim.removeListener(listenerId);
  }, [scrollYAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    onRefreshBackend();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollYAnim } } }],
    { useNativeDriver: true }
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const headerOpacity = scrollYAnim.interpolate({
    inputRange: [30, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollYAnim.interpolate({
    inputRange: [30, 80],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* STICKY NAV BAR */}
      <Animated.View
        style={[
          styles.stickyHeader, 
          { 
            backgroundColor: theme.surface, 
            borderBottomColor: theme.border,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
        pointerEvents={scrollYState > 60 ? 'auto' : 'none'}
      >
        <View style={styles.stickyHeaderContent}>
          <Text style={[styles.stickyTitle, { color: theme.text }]}>Nova Dashboard</Text>
          <OrbStatus status={backendStatus} theme={theme} />
        </View>
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* HERO SECTION */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.hero}
      >
        <View style={styles.headerRow}>
          <View style={styles.userSection}>
            <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <UserIcon color={theme.text} size={24} />
            </View>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
              <Text style={[styles.userName, { color: theme.text }]}>{user.username}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.statusPill, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}
            onPress={onRefreshBackend}
          >
            <OrbStatus status={backendStatus} theme={theme} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {backendLoading ? 'Syncing...' : 'Nova Online'}
            </Text>
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* ANALYTICS BAR */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.statsScroll}
      >
        {[
          { label: 'Memories', value: stats.memories, icon: <BrainIcon color={theme.primary} size={24} /> },
          { label: 'Meetings', value: stats.meetings, icon: <BriefcaseIcon color={theme.accent} size={24} /> },
          { label: 'Focus Score', value: `${stats.focus}%`, icon: <TargetIcon color={theme.success} size={24} /> },
        ].map((stat, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 100 }}
            style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={{ marginRight: 12 }}>{stat.icon}</View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      {/* MAIN SERVICES */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
      </View>

      <AssistantFaceCard onPress={onOpenVoice} theme={theme} scrollY={scrollYState} />

      <View style={styles.grid}>
        <View style={styles.gridColumn}>
          <AuraCard 
            title="Neural Chat"
            subtitle="Deep context interaction"
            icon={<MessageIcon color="#FFF" size={24} />}
            onPress={onOpenChat}
            theme={theme}
            variant="primary"
            style={{ marginBottom: 16 }}
          />
          <AuraCard 
            title="Focus Flow"
            subtitle="Enter deep work"
            icon={<TargetIcon color={theme.accent} size={24} />}
            onPress={onOpenProductivity}
            theme={theme}
            variant="glass"
            style={{ marginBottom: 16 }}
          />
          <AuraCard 
            title="People Hub"
            subtitle="Manage Contacts"
            icon={<UserIcon color={theme.text} size={24} />}
            onPress={onOpenContacts}
            theme={theme}
            variant="glass"
          />
        </View>
        <View style={styles.gridColumn}>
          <AuraCard 
            title="Memory Store"
            subtitle="Retrieve everything"
            icon={<BrainIcon color={theme.primary} size={24} />}
            onPress={onOpenMemories}
            theme={theme}
            style={{ marginBottom: 16 }}
          />
          <AuraCard 
            title="Meeting Intel"
            subtitle="Summaries & Actions"
            icon={<BriefcaseIcon color={theme.text} size={24} />}
            onPress={onOpenMeeting}
            theme={theme}
            style={{ marginBottom: 16 }}
          />
          <AuraCard 
            title="Tasks & Schedule"
            subtitle="Manage your day"
            icon={<TargetIcon color={theme.primary} size={24} />}
            onPress={onOpenTasks || (() => {})}
            theme={theme}
            variant="glass"
          />
        </View>
      </View>

      {/* DAILY INTEL (Real-time Briefing) */}
      <View style={[styles.sectionHeader, { marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Intel</Text>
        <TouchableOpacity onPress={onOpenBriefing}>
          <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>View Full</Text>
        </TouchableOpacity>
      </View>

      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.activityList, { backgroundColor: theme.surface, borderColor: theme.border, padding: 16 }]}
      >
        {briefingLoading ? (
          <ActivityIndicator color={theme.primary} size="small" style={{ marginVertical: 20 }} />
        ) : (
          <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22, fontWeight: '500' }}>
            {briefing}
          </Text>
        )}
      </MotiView>

      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 20,
  },
  hero: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  orbContainer: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orbPulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsScroll: {
    paddingBottom: 32,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '48%',
  },
  activityList: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  activityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  faceCard: {
    borderRadius: 32,
    marginBottom: 16,
    elevation: 8,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  faceInner: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  faceContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  faceInnerFeatures: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blush: {
    position: 'absolute',
    top: 32,
    width: 14,
    height: 8,
    borderRadius: 7,
    backgroundColor: '#FF6B8B',
    opacity: 0.6,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32,
    marginBottom: 6,
  },
  eyeWrapper: {
    alignItems: 'center',
  },
  eyelash: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  eyelashLeft: {
    transform: [{ rotate: '-30deg' }, { translateX: -2 }],
  },
  eyelashRight: {
    transform: [{ rotate: '30deg' }, { translateX: 2 }],
  },
  eye: {
    width: 8,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  mouth: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  faceTextContainer: {
    flex: 1,
  },
  faceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  faceSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});
