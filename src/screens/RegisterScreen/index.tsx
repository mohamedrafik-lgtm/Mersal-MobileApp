/**
 * Register Screen
 * Morasel - WhatsApp Campaign Automation
 *
 * This screen orchestrates components and delegates
 * business logic to the useRegister hook (Single Responsibility).
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
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';
import { useRegister } from '../../hooks';
import { LoginHeader, LoginFooter } from '../../components/LoginScreen';
import { EmailInput, PasswordInput } from '../../components/LoginScreen';
import { NameInput, PhoneInput, RegisterButton } from '../../components/RegisterScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

// Enable RTL for Arabic
I18nManager.allowRTL(true);

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const {
    name,
    email,
    phone,
    password,
    isLoading,
    showPassword,
    nameError,
    emailError,
    phoneError,
    passwordError,
    emailInputRef,
    phoneInputRef,
    passwordInputRef,
    handleNameChange,
    handleEmailChange,
    handlePhoneChange,
    handlePasswordChange,
    toggleShowPassword,
    handleRegister,
    focusEmailInput,
    focusPhoneInput,
    focusPasswordInput,
  } = useRegister();

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

          {/* Form Card */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            <Text style={styles.formTitle}>إنشاء حساب جديد</Text>
            <Text style={styles.formSubtitle}>
              أنشئ حسابك للبدء في إدارة حملاتك على واتساب
            </Text>

            <NameInput
              value={name}
              onChangeText={handleNameChange}
              error={nameError}
              editable={!isLoading}
              onSubmitEditing={focusEmailInput}
            />

            <EmailInput
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              editable={!isLoading}
              onSubmitEditing={focusPhoneInput}
            />

            <PhoneInput
              value={phone}
              onChangeText={handlePhoneChange}
              error={phoneError}
              editable={!isLoading}
              onSubmitEditing={focusPasswordInput}
              inputRef={phoneInputRef}
            />

            <PasswordInput
              value={password}
              onChangeText={handlePasswordChange}
              error={passwordError}
              editable={!isLoading}
              showPassword={showPassword}
              onToggleShowPassword={toggleShowPassword}
              onSubmitEditing={handleRegister}
              inputRef={passwordInputRef}
            />

            <RegisterButton onPress={handleRegister} isLoading={isLoading} />

            {/* Link to Login */}
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>لديك حساب بالفعل؟ </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkAction}>تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
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
  linkRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  linkText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  linkAction: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.primary,
  },
});

export default RegisterScreen;
