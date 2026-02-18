/**
 * NameInput Component
 * User name text input with validation error display
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface NameInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error: string;
  editable: boolean;
  onSubmitEditing: () => void;
}

const NameInput: React.FC<NameInputProps> = ({
  value,
  onChangeText,
  error,
  editable,
  onSubmitEditing,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>اسم المستخدم</Text>
      <View
        style={[styles.inputContainer, error ? styles.inputError : null]}
      >
        <Text style={styles.inputIcon}>👤</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل اسمك الكامل"
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="words"
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

export default NameInput;
