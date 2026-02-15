/**
 * LoginFooter Component
 * Copyright text at the bottom
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

const LoginFooter: React.FC = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        مرسال © {new Date().getFullYear()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
  },
});

export default LoginFooter;
