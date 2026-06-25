import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { MotiView } from 'moti';
import { ThemeColors } from '../theme/colors';
import { UserIcon, BrainIcon, MicIcon } from '../components/Icons';
import { AuraCard } from '../components/AuraCard';

interface ProfileScreenProps {
  user: {
    id: number;
    username: string;
    email: string;
    voice_clone_id?: string | null;
  };
  theme: ThemeColors;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const ProfileScreen = ({
  user,
  theme,
  onLogout,
  isDarkMode,
  onToggleTheme,
}: ProfileScreenProps) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* STANDARD APP HEADER */}
      <View style={[styles.appHeader, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <View style={{ flex: 1, alignItems: 'flex-start' }} />
        <View style={{ flex: 2, alignItems: 'center' }}>
          <Text style={[styles.appHeaderTitle, { color: theme.text }]}>Profile</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.background, flex: 1 }}
      >
      {/* PROFILE HEADER */}
      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={styles.header}
      >
        <View style={[styles.avatarLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <UserIcon color={theme.primary} size={48} />
          <View style={[styles.statusIndicator, { backgroundColor: theme.success, borderColor: theme.background }]} />
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>{user.username}</Text>
        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
        
        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
          <Text style={[styles.editButtonText, { color: theme.text }]}>Edit Profile</Text>
        </TouchableOpacity>
      </MotiView>

      {/* SETTINGS SECTIONS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Configuration</Text>
        <AuraCard
          title="Voice Identity"
          subtitle={user.voice_clone_id ? "Active: Professional Male" : "Standard Voice"}
          icon={<MicIcon color={theme.primary} size={24} />}
          onPress={() => {}}
          theme={theme}
          style={{ marginBottom: 16 }}
          rightElement={
             <View style={[styles.tag, { backgroundColor: theme.primary + '20' }]}>
               <Text style={[styles.tagText, { color: theme.primary }]}>Pro</Text>
             </View>
          }
        />
        <AuraCard
          title="Memory Retrieval"
          subtitle="Augmented context enabled"
          icon={<BrainIcon color={theme.accent} size={24} />}
          onPress={() => {}}
          theme={theme}
          variant="glass"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <View style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>Optimized for OLED displays</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={onToggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        </View>
        
        <View style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 12 }]}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Real-time Sync</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>Cloud memory backup</Text>
          </View>
          <Switch 
            value={true} 
            onValueChange={() => {}}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity 
        style={[styles.logoutButton, { borderColor: theme.error + '40' }]} 
        onPress={onLogout}
      >
        <Text style={[styles.logoutText, { color: theme.error }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.textSecondary }]}>Aura v1.0.4 (2026.06.18)</Text>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1 
  },
  appHeaderTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    letterSpacing: -0.3 
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  editButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: -0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  logoutButton: {
    marginTop: 10,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
  },
  version: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
});
