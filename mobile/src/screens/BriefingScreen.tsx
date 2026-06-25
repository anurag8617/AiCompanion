import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MotiView, MotiText } from 'moti';
import { ThemeColors } from '../theme/colors';
import { XIcon } from '../components/Icons';

interface BriefingScreenProps {
  briefing: string;
  theme: ThemeColors;
  onBack: () => void;
}

export const BriefingScreen = ({ briefing, theme, onBack }: BriefingScreenProps) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#84B179' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#84B179" />
      
      {/* Header */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <XIcon color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DAILY INTEL</Text>
        <View style={{ width: 44 }} />
      </MotiView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 400 }}
        >
          <MotiText 
            style={styles.greeting}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
          >
            Good Morning,
          </MotiText>
          <MotiText 
            style={styles.title}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 800 }}
          >
            Your Daily Briefing
          </MotiText>
        </MotiView>

        <MotiView 
          style={styles.divider} 
          from={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ type: 'timing', duration: 1000, delay: 1000 }}
        />

        <View style={styles.contentContainer}>
          {briefing.split('\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 1200 + (index * 200) }}
                style={styles.paragraphWrapper}
              >
                <Text style={styles.briefingText}>{paragraph.trim()}</Text>
              </MotiView>
            ) : null
          ))}
        </View>

        <MotiView 
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2500 }}
          style={styles.footer}
        >
          <TouchableOpacity style={styles.actionButton} onPress={onBack}>
            <Text style={styles.actionButtonText}>Acknowledge Briefing</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 60,
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 48,
    letterSpacing: -1,
  },
  divider: {
    height: 4,
    backgroundColor: '#E8F5BD',
    marginTop: 24,
    marginBottom: 40,
    borderRadius: 2,
  },
  contentContainer: {
    marginTop: 10,
  },
  paragraphWrapper: {
    marginBottom: 24,
  },
  briefingText: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '500',
    opacity: 0.95,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  actionButtonText: {
    color: '#84B179',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
