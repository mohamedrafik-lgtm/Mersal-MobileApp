/**
 * LoginHeader Component
 * Logo + App name + Tagline
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface LoginHeaderProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ fadeAnim, slideAnim }) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>M</Text>
        </View>
      </View>
      <Text style={styles.appName}>مرسال</Text>
      <Text style={styles.appTagline}>أتمتة حملات الرسائل عبر واتساب</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    marginBottom: Spacing.base,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoText: {
    fontSize: 40,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
  appName: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  appTagline: {
    fontSize: Fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default LoginHeader;
