/**
 * Login Screen
 * Morasel - WhatsApp Campaign Automation
 *
 * This screen only orchestrates components and delegates
 * business logic to the useLogin hook (Single Responsibility).
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  I18nManager,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';
import { useLogin } from '../../hooks';
import {
  LoginHeader,
  EmailInput,
  PasswordInput,
  LoginButton,
  LoginFooter,
} from '../../components/LoginScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

// Enable RTL for Arabic
I18nManager.allowRTL(true);

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation: _navigation }) => {
  const {
    email,
    password,
    isLoading,
    showPassword,
    emailError,
    passwordError,
    passwordInputRef,
    handleEmailChange,
    handlePasswordChange,
    toggleShowPassword,
    handleLogin,
    focusPasswordInput,
  } = useLogin();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header: Logo + App Name (on green bg) */}
          <LoginHeader fadeAnim={fadeAnim} slideAnim={slideAnim} />

          {/* Form Card (white card) */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>
            <Text style={styles.formSubtitle}>
              أدخل بياناتك للوصول إلى حسابك
            </Text>

            <EmailInput
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              editable={!isLoading}
              onSubmitEditing={focusPasswordInput}
            />

            <PasswordInput
              value={password}
              onChangeText={handlePasswordChange}
              error={passwordError}
              editable={!isLoading}
              showPassword={showPassword}
              onToggleShowPassword={toggleShowPassword}
              onSubmitEditing={handleLogin}
              inputRef={passwordInputRef}
            />

            <LoginButton onPress={handleLogin} isLoading={isLoading} />
          </Animated.View>

          {/* Footer (on green bg) */}
          <LoginFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  formCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.xl,
  },
});

export default LoginScreen;
