/**
 * LoginButton Component
 * Primary action button with loading state
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface LoginButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onPress, isLoading }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isLoading ? styles.buttonDisabled : null]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : (
        <Text style={styles.buttonText}>تسجيل الدخول</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.lg,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
});

export default LoginButton;
