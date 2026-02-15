/**
 * EmailInput Component
 * Email text input with validation error display
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error: string;
  editable: boolean;
  onSubmitEditing: () => void;
}

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChangeText,
  error,
  editable,
  onSubmitEditing,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
      <View
        style={[styles.inputContainer, error ? styles.inputError : null]}
      >
        <Text style={styles.inputIcon}>✉</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor="rgba(255, 255, 255, 0.45)"
          value={value}
          onChangeText={onChangeText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={onSubmitEditing}
          editable={editable}
        />
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.base,
    height: 54,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.textLight,
    textAlign: 'right',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: Fonts.sizes.sm,
    color: '#FF6B6B',
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});

export default EmailInput;
