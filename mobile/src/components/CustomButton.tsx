import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import { ThemeColors } from '../theme/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  theme: ThemeColors;
  variant?: 'primary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const CustomButton = ({
  title,
  onPress,
  theme,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: CustomButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const isButtonDisabled = disabled || loading;

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return [
          styles.button,
          styles.outlineButton,
          { borderColor: theme.primary, backgroundColor: 'transparent' },
        ];
      case 'text':
        return [styles.button, styles.textButton, { backgroundColor: 'transparent' }];
      case 'primary':
      default:
        return [
          styles.button,
          styles.primaryButton,
          { backgroundColor: isButtonDisabled ? theme.primary + '88' : theme.primary },
        ];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
      case 'text':
        return [styles.text, { color: theme.primary }];
      case 'primary':
      default:
        return [styles.text, { color: '#FFFFFF' }];
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={isButtonDisabled}
      style={{ width: '100%' }}
      activeOpacity={1}
    >
      <MotiView
        animate={{
          scale: isPressed ? 0.96 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 100,
        }}
        style={[getButtonStyle(), style]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : theme.primary} />
        ) : (
          <Text style={getTextStyle()}>{title}</Text>
        )}
      </MotiView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  outlineButton: {
    borderWidth: 1.5,
  },
  textButton: {
    height: 'auto',
    paddingVertical: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
