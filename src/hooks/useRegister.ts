/**
 * useRegister Hook - Business Logic for Register Screen
 */

import { useState, useRef, useCallback } from 'react';
import { TextInput, Alert } from 'react-native';
import { authService } from '../services';
import { useAuth } from '../context';

export interface UseRegisterReturn {
  // State
  name: string;
  email: string;
  phone: string;
  password: string;
  isLoading: boolean;
  showPassword: boolean;
  nameError: string;
  emailError: string;
  phoneError: string;
  passwordError: string;

  // Refs
  emailInputRef: React.RefObject<TextInput | null>;
  phoneInputRef: React.RefObject<TextInput | null>;
  passwordInputRef: React.RefObject<TextInput | null>;

  // Actions
  handleNameChange: (text: string) => void;
  handleEmailChange: (text: string) => void;
  handlePhoneChange: (text: string) => void;
  handlePasswordChange: (text: string) => void;
  toggleShowPassword: () => void;
  handleRegister: () => Promise<void>;
  focusEmailInput: () => void;
  focusPhoneInput: () => void;
  focusPasswordInput: () => void;
}

const useRegister = (): UseRegisterReturn => {
  const { signIn } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const validateName = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setNameError('اسم المستخدم مطلوب');
      return false;
    }
    if (value.trim().length < 2) {
      setNameError('الاسم يجب أن يكون حرفين على الأقل');
      return false;
    }
    setNameError('');
    return true;
  }, []);

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

  const validatePhone = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setPhoneError('رقم الهاتف مطلوب');
      return false;
    }
    if (value.trim().length < 8) {
      setPhoneError('يرجى إدخال رقم هاتف صالح');
      return false;
    }
    setPhoneError('');
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

  const handleNameChange = useCallback(
    (text: string) => {
      setName(text);
      if (nameError) {
        validateName(text);
      }
    },
    [nameError, validateName],
  );

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (emailError) {
        validateEmail(text);
      }
    },
    [emailError, validateEmail],
  );

  const handlePhoneChange = useCallback(
    (text: string) => {
      setPhone(text);
      if (phoneError) {
        validatePhone(text);
      }
    },
    [phoneError, validatePhone],
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

  const focusEmailInput = useCallback(() => {
    emailInputRef.current?.focus();
  }, []);

  const focusPhoneInput = useCallback(() => {
    phoneInputRef.current?.focus();
  }, []);

  const focusPasswordInput = useCallback(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleRegister = useCallback(async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isPasswordValid = validatePassword(password);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      // Save session & navigate to home (AuthContext handles navigation automatically)
      await signIn(response.token, response.user);
    } catch (error: any) {
      Alert.alert(
        'خطأ في إنشاء الحساب',
        error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
      );
    } finally {
      setIsLoading(false);
    }
  }, [name, email, phone, password, validateName, validateEmail, validatePhone, validatePassword, signIn]);

  return {
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
  };
};

export default useRegister;
