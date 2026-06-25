import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { ThemeColors } from '../theme/colors';

interface AuraCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
  theme: ThemeColors;
  style?: ViewStyle;
  variant?: 'primary' | 'surface' | 'glass';
  rightElement?: React.ReactNode;
}

export const AuraCard = ({
  title,
  subtitle,
  icon,
  onPress,
  theme,
  style,
  variant = 'surface',
  rightElement,
}: AuraCardProps) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.primary;
      case 'glass': return theme.glass;
      default: return theme.surface;
    }
  };

  const getBorderColor = () => {
    return variant === 'glass' ? theme.glassBorder : theme.border;
  };

  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable 
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
    >
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ 
          opacity: 1, 
          translateY: isPressed ? 2 : 0,
          scale: isPressed ? 0.95 : 1 
        }}
        transition={{ type: 'spring', damping: 15 }}
        style={[
          styles.card,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            shadowColor: theme.shadow,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconContainer, { backgroundColor: variant === 'primary' ? 'rgba(255,255,255,0.2)' : theme.background }]}>
            {icon}
          </View>
          {rightElement}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: variant === 'primary' ? '#FFF' : theme.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: variant === 'primary' ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </MotiView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
});
