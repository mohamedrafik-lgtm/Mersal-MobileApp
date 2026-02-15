/**
 * AppDrawer — Slide-out side menu
 * Opens/closes with animation from the right side (RTL).
 * Contains navigation links matching the web sidebar.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts, Spacing } from '../../theme';
import { useAuth } from '../../context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

export interface DrawerMenuItem {
  key: string;
  label: string;
  icon: string;
}

export const MENU_ITEMS: DrawerMenuItem[] = [
  { key: 'Dashboard', label: 'نظرة عامة', icon: 'view-dashboard-outline' },
  { key: 'Channels', label: 'القنوات', icon: 'cellphone-link' },
  { key: 'Campaigns', label: 'الحملات', icon: 'send-outline' },
  { key: 'Contacts', label: 'جهات الاتصال', icon: 'account-group-outline' },
  { key: 'Templates', label: 'الأنشطة', icon: 'clipboard-text-outline' },
  { key: 'Points', label: 'نقاطي', icon: 'star-four-points-outline' },
  { key: 'Account', label: 'حسابي', icon: 'account-outline' },
];

interface AppDrawerProps {
  visible: boolean;
  activeScreen: string;
  onClose: () => void;
  onNavigate: (key: string) => void;
}

const AppDrawer: React.FC<AppDrawerProps> = ({
  visible,
  activeScreen,
  onClose,
  onNavigate,
}) => {
  const { user, signOut } = useAuth();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer Panel */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
      >
        <SafeAreaView style={styles.drawerSafe}>
          {/* Logo / Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Icon name="send" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.brandName}>مرسال</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
          >
            {MENU_ITEMS.map(item => {
              const isActive = activeScreen === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => onNavigate(item.key)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={item.icon}
                    size={22}
                    color={isActive ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.menuItemLabel,
                      isActive && styles.menuItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bottom: User Info + Logout */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />

            {/* User info */}
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name || 'المستخدم'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutRow} onPress={signOut}>
              <Icon name="logout" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  drawerSafe: {
    flex: 1,
  },
  brandSection: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  menuScroll: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    gap: Spacing.md,
  },
  menuItemActive: {
    backgroundColor: Colors.primary + '15',
  },
  menuItemLabel: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textSecondary,
  },
  menuItemLabelActive: {
    color: Colors.primary,
    fontWeight: Fonts.weights.semiBold,
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.base,
  },
  userRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  logoutRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  logoutText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.error,
  },
});

export default AppDrawer;
