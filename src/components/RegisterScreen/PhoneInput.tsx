/**
 * PhoneInput Component
 * Phone number text input with validation error display
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error: string;
  editable: boolean;
  onSubmitEditing: () => void;
  inputRef: React.RefObject<TextInput | null>;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  error,
  editable,
  onSubmitEditing,
  inputRef,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>رقم الهاتف</Text>
      <View
        style={[styles.inputContainer, error ? styles.inputError : null]}
      >
        <Text style={styles.inputIcon}>📱</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="+966XXXXXXXXX"
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
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
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
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
  errorText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.error,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});

export default PhoneInput;
