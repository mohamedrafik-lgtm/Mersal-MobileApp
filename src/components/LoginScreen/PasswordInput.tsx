/**
 * PasswordInput Component
 * Password text input with show/hide toggle and validation error display
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error: string;
  editable: boolean;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  onSubmitEditing: () => void;
  inputRef: React.RefObject<TextInput | null>;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  error,
  editable,
  showPassword,
  onToggleShowPassword,
  onSubmitEditing,
  inputRef,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>كلمة المرور</Text>
      <View
        style={[styles.inputContainer, error ? styles.inputError : null]}
      >
        <Text style={styles.inputIcon}>🔒</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="rgba(255, 255, 255, 0.45)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
          editable={editable}
        />
        <TouchableOpacity
          onPress={onToggleShowPassword}
          style={styles.eyeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.eyeIcon}>
            {showPassword ? '👁' : '👁‍🗨'}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.base,
    height: 54,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.error,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});

export default PasswordInput;
