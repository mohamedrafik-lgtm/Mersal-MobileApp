/**
 * Splash / Loading Screen
 * Shown while restoring auth session from storage
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>M</Text>
      </View>
      <Text style={styles.appName}>مرسال</Text>
      <ActivityIndicator
        size="large"
        color="rgba(255,255,255,0.8)"
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '60',
    marginBottom: Spacing.base,
  },
  logoText: {
    fontSize: 40,
    fontWeight: Fonts.weights.bold,
    color: Colors.primary,
  },
  appName: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },
  loader: {
    marginTop: Spacing.lg,
  },
});

export default SplashScreen;
