import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { MotiView, AnimatePresence } from 'moti';
import { ThemeColors } from '../theme/colors';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { MailIcon, LockIcon, UserIcon } from '../components/Icons';

interface LoginScreenProps {
  theme: ThemeColors;
  baseUrl: string;
  onLoginSuccess: (user: any) => void;
}

export const LoginScreen = ({ theme, baseUrl, onLoginSuccess }: LoginScreenProps) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');

  // Validation error states
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    loginIdentifier?: string;
  }>({});

  const validateForm = () => {
    const tempErrors: typeof errors = {};
    let isValid = true;

    if (isLoginMode) {
      if (!loginIdentifier.trim()) {
        tempErrors.loginIdentifier = 'Username or Email is required';
        isValid = false;
      }
    } else {
      if (!username.trim()) {
        tempErrors.username = 'Username is required';
        isValid = false;
      } else if (username.trim().length < 3) {
        tempErrors.username = 'Username must be at least 3 characters';
        isValid = false;
      }

      if (!email.trim()) {
        tempErrors.email = 'Email is required';
        isValid = false;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          tempErrors.email = 'Please enter a valid email address';
          isValid = false;
        }
      }

      if (!password) {
        tempErrors.password = 'Password is required';
        isValid = false;
      } else if (password.length < 6) {
        tempErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      }
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleAuth = async () => {
    setGlobalError(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLoginMode) {
        // Login API Call
        const response = await axios.post(`${baseUrl}/api/auth/login`, {
          loginIdentifier: loginIdentifier.trim(),
          password,
        });

        if (response.data.status === 'success') {
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            onLoginSuccess({ ...response.data.user, token: response.data.token });
          }, 600);
        } else {
          setGlobalError(response.data.error || 'Login failed');
        }
      } else {
        // Register API Call
        const response = await axios.post(`${baseUrl}/api/auth/register`, {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        if (response.data.status === 'success') {
          setSuccessMsg('Registration successful! Switched to login.');
          // Auto fill login identifier with the new user's username
          setLoginIdentifier(username.trim());
          setPassword('');
          // Switch mode
          setTimeout(() => {
            setIsLoginMode(true);
            setSuccessMsg(null);
          }, 1500);
        } else {
          setGlobalError(response.data.error || 'Registration failed');
        }
      }
    } catch (error: any) {
      console.log('Authentication API Error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setGlobalError(error.response.data.error);
      } else {
        setGlobalError('Network error. Is the backend server running?');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    setGlobalError(null);
    setSuccessMsg(null);
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 600 }}
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
        >
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 200 }}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {isLoginMode ? 'Welcome Back' : 'Get Started'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isLoginMode ? 'Sign in to access your AI Companion' : 'Create your account to start'}
            </Text>
          </MotiView>

          <AnimatePresence>
            {globalError && (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={[styles.banner, { backgroundColor: theme.error + '15', borderColor: theme.error }]}
              >
                <Text style={[styles.bannerText, { color: theme.error }]}>{globalError}</Text>
              </MotiView>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <MotiView
              key={isLoginMode ? 'login-form' : 'register-form'}
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -5 }}
              transition={{ type: 'timing', duration: 250 }}
              style={styles.form}
            >
              {isLoginMode ? (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 100 }}
                >
                  <CustomInput
                    label="Username or Email"
                    value={loginIdentifier}
                    onChangeText={setLoginIdentifier}
                    placeholder="Enter username or email"
                    error={errors.loginIdentifier}
                    theme={theme}
                    autoCapitalize="none"
                    iconPrefix={<UserIcon color={theme.textSecondary} size={18} />}
                  />
                </MotiView>
              ) : (
                <>
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 100 }}
                  >
                    <CustomInput
                      label="Username"
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Choose username"
                      error={errors.username}
                      theme={theme}
                      autoCapitalize="none"
                      iconPrefix={<UserIcon color={theme.textSecondary} size={18} />}
                    />
                  </MotiView>
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 150 }}
                  >
                    <CustomInput
                      label="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter email address"
                      error={errors.email}
                      theme={theme}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      iconPrefix={<MailIcon color={theme.textSecondary} size={18} />}
                    />
                  </MotiView>
                </>
              )}

              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 200 }}
              >
                <CustomInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  error={errors.password}
                  theme={theme}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  iconPrefix={<LockIcon color={theme.textSecondary} size={18} />}
                />
              </MotiView>

              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 250 }}
              >
                <CustomButton
                  title={isLoginMode ? 'Sign In' : 'Create Account'}
                  onPress={handleAuth}
                  theme={theme}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </MotiView>
            </MotiView>
          </AnimatePresence>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 800 }}
          >
            <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer} activeOpacity={0.7}>
              <Text style={{ color: theme.textSecondary }}>
                {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  {isLoginMode ? 'Register' : 'Log In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </MotiView>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  banner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
});
