/**
 * Home Screen — Dashboard
 * Matches the web dashboard layout adapted for mobile.
 *
 * Shows:
 *  • Welcome message
 *  • Stats cards (points, campaigns, delivery rate, total messages)
 *  • Channel connection status
 *  • Message activity chart (bar chart from API)
 *  • Recent campaigns list
 */

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts, Spacing } from '../../theme';
import { useAuth } from '../../context';
import { dashboardService } from '../../services';
import { DrawerContext } from '../../navigation';
import type { DashboardStats, ChartDataItem, Channel } from '../../services';

// ─── Stat Card ───────────────────────────────────────────
interface StatCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, label, value }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: iconColor + '18' }]}>
      <Icon name={icon} size={22} color={iconColor} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// ─── Mini Bar Chart ─────────────────────────────────────
const ChartBar: React.FC<{ item: ChartDataItem; maxValue: number }> = ({
  item,
  maxValue,
}) => {
  const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 4;
  return (
    <View style={styles.chartBarWrapper}>
      <Text style={styles.chartBarValue}>{item.value}</Text>
      <View style={styles.chartBarTrack}>
        <View
          style={[
            styles.chartBarFill,
            { height: `${Math.max(barHeight, 4)}%` },
          ]}
        />
      </View>
      <Text style={styles.chartBarLabel}>{item.name}</Text>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────
const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { openDrawer } = useContext(DrawerContext);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashboardStats, channelsRes] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getChannels(),
      ]);
      setStats(dashboardStats);
      setChannels(Array.isArray(channelsRes) ? channelsRes : []);
    } catch {
      // Silently handle — user sees "—" for unfetched data
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived values
  const hasChannels = channels.length > 0;
  const formattedPoints =
    stats !== null ? stats.points.toLocaleString('ar-EG') : '—';
  const deliveryRate =
    stats !== null ? `${stats.deliveryRate.toFixed(1)}%` : '—';
  const totalMessages =
    stats !== null ? stats.totalMessages.toLocaleString('ar-EG') : '—';
  const campaignCount =
    stats !== null ? stats.campaignCount.toLocaleString('ar-EG') : '—';
  const chartData = stats?.chartData ?? [];
  const chartMax = Math.max(...chartData.map(d => d.value), 1);
  const hasChartData = chartData.some(d => d.value > 0);
  const recentCampaigns = stats?.recentCampaigns ?? [];

  // ─── Render ────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="menu" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>لوحة التحكم</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />

      {/* ── Top Bar ──────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="menu" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>لوحة التحكم</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Welcome ────────────────────────────────────── */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            مرحباً بعودتك، {user?.name || 'المستخدم'} 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>
            إليك نظرة عامة على أداء حملاتك على واتساب اليوم
          </Text>
        </View>

        {/* ── Stats Grid (2 × 2) ─────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="send"
            iconColor={Colors.primary}
            label="إجمالي الرسائل المرسلة"
            value={totalMessages}
          />
          <StatCard
            icon="check-circle-outline"
            iconColor={Colors.accent}
            label="معدل التسليم"
            value={deliveryRate}
          />
          <StatCard
            icon="chart-bar"
            iconColor={Colors.primaryLight}
            label="عدد الحملات"
            value={campaignCount}
          />
          <StatCard
            icon="star-circle-outline"
            iconColor="#F5A623"
            label="الرصيد الحالي"
            value={`${formattedPoints} نقطة`}
          />
        </View>

        {/* ── Connection Status ──────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      (stats?.connectedChannels ?? 0) > 0
                        ? Colors.accent
                        : Colors.error,
                  },
                ]}
              />
              <Text style={styles.sectionTitle}>حالة الاتصال</Text>
            </View>
            {stats && (
              <Text style={styles.sectionSubtitle}>
                {stats.connectedChannels}/{stats.totalChannels}
              </Text>
            )}
          </View>

          {hasChannels ? (
            channels.map(channel => (
              <View key={channel.id} style={styles.channelRow}>
                <View style={styles.channelInfo}>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.channelPhone}>{channel.phoneNumber}</Text>
                </View>
                <View
                  style={[
                    styles.channelBadge,
                    {
                      backgroundColor: channel.isConnected
                        ? Colors.accent + '20'
                        : Colors.error + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.channelBadgeText,
                      {
                        color: channel.isConnected
                          ? Colors.accent
                          : Colors.error,
                      },
                    ]}
                  >
                    {channel.isConnected ? 'متصل' : 'غير متصل'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon
                name="alert-circle-outline"
                size={40}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>لا توجد قنوات متصلة</Text>
            </View>
          )}
        </View>

        {/* ── Message Activity ───────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>نشاط الرسائل</Text>
            <Text style={styles.sectionSubtitle}>آخر 7 أيام</Text>
          </View>

          {hasChartData ? (
            <View style={styles.chartContainer}>
              {chartData.map((item, index) => (
                <ChartBar key={index} item={item} maxValue={chartMax} />
              ))}
            </View>
          ) : (
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-bar" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                لا توجد رسائل مرسلة في آخر 7 أيام
              </Text>
            </View>
          )}
        </View>

        {/* ── Recent Campaigns ───────────────────────────── */}
        <View style={[styles.sectionCard, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الحملات الأخيرة</Text>
          </View>

          {recentCampaigns.length > 0 ? (
            recentCampaigns.map(campaign => (
              <View key={campaign.id} style={styles.campaignRow}>
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignName}>{campaign.name}</Text>
                  <Text style={styles.campaignMeta}>
                    {campaign.sentCount}/{campaign.totalCount} رسالة
                  </Text>
                </View>
                <View
                  style={[
                    styles.channelBadge,
                    {
                      backgroundColor:
                        campaign.status === 'completed'
                          ? Colors.accent + '20'
                          : campaign.status === 'failed'
                            ? Colors.error + '20'
                            : Colors.primaryLight + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.channelBadgeText,
                      {
                        color:
                          campaign.status === 'completed'
                            ? Colors.accent
                            : campaign.status === 'failed'
                              ? Colors.error
                              : Colors.primaryLight,
                      },
                    ]}
                  >
                    {campaign.status === 'completed'
                      ? 'مكتملة'
                      : campaign.status === 'failed'
                        ? 'فشلت'
                        : campaign.status === 'running'
                          ? 'قيد التنفيذ'
                          : campaign.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="send" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>لا توجد حملات بعد</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    backgroundColor: Colors.backgroundSecondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
    textAlign: 'right',
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  /* Welcome */
  welcomeSection: {
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-end',
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* Channel Rows */
  channelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  channelInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  channelName: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  channelPhone: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  channelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  channelBadgeText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semiBold,
  },

  /* Empty / Placeholder */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },

  /* Chart */
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: Spacing.sm,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarValue: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  chartBarTrack: {
    width: 20,
    height: 100,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  /* Campaign Rows */
  campaignRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  campaignInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  campaignName: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  campaignMeta: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
});

export default HomeScreen;
