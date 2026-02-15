/**
 * Main Navigator
 * State-based navigator with a custom slide-out drawer menu.
 * Replaces the bottom tab bar with a hamburger menu approach.
 */

import React, { useState, useCallback } from 'react';
import AppDrawer from '../components/AppDrawer';
import HomeScreen from '../screens/HomeScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import AccountScreen from '../screens/AccountScreen';

// Context so any screen can open the drawer & know current screen
export const DrawerContext = React.createContext<{
  openDrawer: () => void;
  activeScreen: string;
}>({
  openDrawer: () => {},
  activeScreen: 'Dashboard',
});

const SCREENS: Record<string, React.FC> = {
  Dashboard: HomeScreen,
  Campaigns: CampaignsScreen,
  Channels: ChannelsScreen,
  Contacts: ContactsScreen,
  Account: AccountScreen,
};

const MainNavigator: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Dashboard');

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  const handleNavigate = useCallback(
    (key: string) => {
      if (SCREENS[key]) {
        setActiveScreen(key);
      }
      closeDrawer();
    },
    [closeDrawer],
  );

  const ActiveComponent = SCREENS[activeScreen] || HomeScreen;

  return (
    <DrawerContext.Provider value={{ openDrawer, activeScreen }}>
      <ActiveComponent key={activeScreen} />
      <AppDrawer
        visible={drawerVisible}
        activeScreen={activeScreen}
        onClose={closeDrawer}
        onNavigate={handleNavigate}
      />
    </DrawerContext.Provider>
  );
};

export default MainNavigator;
