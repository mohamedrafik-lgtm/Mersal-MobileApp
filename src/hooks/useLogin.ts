/**
 * useLogin Hook - Business Logic for Login Screen
 */

import { useState, useRef, useCallback } from 'react';
import { TextInput, Alert } from 'react-native';
import { authService } from '../services';
import { useAuth } from '../context';

export interface UseLoginReturn {
  // State
  email: string;
  password: string;
  isLoading: boolean;
  showPassword: boolean;
  emailError: string;
  passwordError: string;

  // Refs
  passwordInputRef: React.RefObject<TextInput | null>;

  // Actions
  setEmail: (text: string) => void;
  setPassword: (text: string) => void;
  toggleShowPassword: () => void;
  handleEmailChange: (text: string) => void;
  handlePasswordChange: (text: string) => void;
  handleLogin: () => Promise<void>;
  focusPasswordInput: () => void;
}

const useLogin = (): UseLoginReturn => {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordInputRef = useRef<TextInput>(null);

  const validateEmail = useCallback((value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('البريد الإلكتروني مطلوب');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('يرجى إدخال بريد إلكتروني صالح');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const validatePassword = useCallback((value: string): boolean => {
    if (!value) {
      setPasswordError('كلمة المرور مطلوبة');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    setPasswordError('');
    return true;
  }, []);

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (emailError) {
        validateEmail(text);
      }
    },
    [emailError, validateEmail],
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (passwordError) {
        validatePassword(text);
      }
    },
    [passwordError, validatePassword],
  );

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const focusPasswordInput = useCallback(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleLogin = useCallback(async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      // Save session & navigate (AuthContext handles navigation automatically)
      await signIn(response.token, response.user);
    } catch (error: any) {
      Alert.alert(
        'خطأ في تسجيل الدخول',
        error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, password, validateEmail, validatePassword]);

  return {
    email,
    password,
    isLoading,
    showPassword,
    emailError,
    passwordError,
    passwordInputRef,
    setEmail,
    setPassword,
    toggleShowPassword,
    handleEmailChange,
    handlePasswordChange,
    handleLogin,
    focusPasswordInput,
  };
};

export default useLogin;
