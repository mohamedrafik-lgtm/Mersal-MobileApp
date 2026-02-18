/**
 * Points Screen (نقاطي)
 * Shows points balance, statistics & transaction history
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts, Spacing } from '../../theme';
import { pointsService } from '../../services';
import type {
  PointsStats,
  Transaction,
  TransactionType,
} from '../../services';
import TopBar from '../../components/TopBar';

const PAGE_LIMIT = 20;

// ─── Transaction Type Helpers ────────────────────────────

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  admin_add: 'إضافة رصيد',
  admin_deduct: 'خصم إداري',
  campaign_deduct: 'خصم حملة',
};

const TRANSACTION_ICONS: Record<TransactionType, string> = {
  admin_add: 'arrow-down-circle-outline',
  admin_deduct: 'arrow-up-circle-outline',
  campaign_deduct: 'send-outline',
};

const TRANSACTION_COLORS: Record<TransactionType, string> = {
  admin_add: Colors.success,
  admin_deduct: Colors.error,
  campaign_deduct: Colors.warning,
};

// ─── Filter Tabs ─────────────────────────────────────────

type FilterType = 'all' | TransactionType;

interface FilterTab {
  key: FilterType;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'الكل' },
  { key: 'admin_add', label: 'إضافة' },
  { key: 'admin_deduct', label: 'خصم إداري' },
  { key: 'campaign_deduct', label: 'حملات' },
];

// ─── Stats Card Component ────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <View style={statStyles.card}>
    <View style={[statStyles.iconCircle, { backgroundColor: color + '18' }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

// ─── Transaction Card Component ──────────────────────────

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const txType = transaction.type as TransactionType;
  const color = TRANSACTION_COLORS[txType] || Colors.textMuted;
  const icon = TRANSACTION_ICONS[txType] || 'help-circle-outline';
  const label = TRANSACTION_LABELS[txType] || transaction.type;
  const isPositive = txType === 'admin_add';

  const formattedDate = (() => {
    try {
      const d = new Date(transaction.createdAt);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return transaction.createdAt;
    }
  })();

  return (
    <View style={txStyles.card}>
      <View style={txStyles.row}>
        {/* Icon */}
        <View style={[txStyles.iconCircle, { backgroundColor: color + '18' }]}>
          <Icon name={icon} size={22} color={color} />
        </View>

        {/* Info */}
        <View style={txStyles.info}>
          <Text style={txStyles.label}>{label}</Text>
          {transaction.description ? (
            <Text style={txStyles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
          ) : null}
          <Text style={txStyles.date}>{formattedDate}</Text>
        </View>

        {/* Amount */}
        <View style={txStyles.amountCol}>
          <Text style={[txStyles.amount, { color }]}>
            {isPositive ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()}
          </Text>
          <Text style={txStyles.balance}>
            الرصيد: {transaction.balanceAfter?.toLocaleString() ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────

const PointsScreen: React.FC = () => {
  // Stats
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const isFirstLoad = useRef(true);

  // ─── Fetch Stats ──────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const result = await pointsService.getMyStats();
      setStats(result);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── Fetch Transactions ───────────────────────────────

  const fetchTransactions = useCallback(
    async (p: number = 1, filter: FilterType = 'all', append: boolean = false) => {
      try {
        const params: { page: number; limit: number; type?: TransactionType } = {
          page: p,
          limit: PAGE_LIMIT,
        };
        if (filter !== 'all') {
          params.type = filter;
        }
        const result = await pointsService.getTransactions(params);
        if (append) {
          setTransactions(prev => [...prev, ...result.data]);
        } else {
          setTransactions(result.data);
        }
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch {
        // silent
      } finally {
        setTxLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // ─── Initial Load ─────────────────────────────────────

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchStats();
      fetchTransactions(1, 'all');
    }
  }, [fetchStats, fetchTransactions]);

  // ─── Handlers ─────────────────────────────────────────

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setStatsLoading(true);
    fetchStats();
    setPage(1);
    fetchTransactions(1, activeFilter);
  }, [fetchStats, fetchTransactions, activeFilter]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) {
      return;
    }
    setLoadingMore(true);
    fetchTransactions(page + 1, activeFilter, true);
  }, [loadingMore, page, totalPages, fetchTransactions, activeFilter]);

  const onFilterChange = useCallback(
    (filter: FilterType) => {
      if (filter === activeFilter) { return; }
      setActiveFilter(filter);
      setTxLoading(true);
      setPage(1);
      fetchTransactions(1, filter);
    },
    [activeFilter, fetchTransactions],
  );

  // ─── Format helpers ───────────────────────────────────

  const formatNumber = (n: number) => n.toLocaleString();

  // ─── List Header ──────────────────────────────────────

  const ListHeader = () => (
    <View>
      {/* Points Balance Hero */}
      <View style={heroStyles.container}>
        <View style={heroStyles.iconBg}>
          <Icon name="star-four-points" size={40} color={Colors.primary} />
        </View>
        {statsLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.md }} />
        ) : (
          <>
            <Text style={heroStyles.points}>
              {formatNumber(stats?.currentPoints ?? 0)}
            </Text>
            <Text style={heroStyles.label}>نقطة متاحة</Text>
          </>
        )}
      </View>

      {/* Stats Grid */}
      {statsLoading ? (
        <View style={statsGridStyles.loading}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : stats ? (
        <View style={statsGridStyles.grid}>
          <StatCard
            icon="arrow-down-circle-outline"
            label="إجمالي المستلم"
            value={formatNumber(stats.totalReceived)}
            color={Colors.success}
          />
          <StatCard
            icon="arrow-up-circle-outline"
            label="إجمالي المصروف"
            value={formatNumber(stats.totalSpent)}
            color={Colors.error}
          />
          <StatCard
            icon="swap-horizontal"
            label="عدد العمليات"
            value={formatNumber(stats.transactionCount)}
            color={Colors.warning}
          />
          <StatCard
            icon="wallet-outline"
            label="الرصيد الحالي"
            value={formatNumber(stats.currentPoints)}
            color={Colors.primary}
          />
        </View>
      ) : null}

      {/* Section Title */}
      <View style={sectionStyles.header}>
        <Icon name="history" size={20} color={Colors.primary} />
        <Text style={sectionStyles.title}>سجل العمليات</Text>
      </View>

      {/* Filter Tabs */}
      <View style={filterStyles.container}>
        {FILTER_TABS.map(tab => {
          const isActive = tab.key === activeFilter;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[filterStyles.tab, isActive && filterStyles.tabActive]}
              onPress={() => onFilterChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[filterStyles.tabText, isActive && filterStyles.tabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ─── Footer ───────────────────────────────────────────

  const renderFooter = () => {
    if (!loadingMore) { return null; }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  // ─── Empty State ──────────────────────────────────────

  const renderEmpty = () => {
    if (txLoading) { return null; }
    return (
      <View style={styles.emptyContainer}>
        <Icon name="receipt" size={56} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>لا توجد عمليات</Text>
        <Text style={styles.emptyText}>
          {activeFilter !== 'all'
            ? 'لا توجد عمليات من هذا النوع'
            : 'لم يتم تسجيل أي عمليات بعد'}
        </Text>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />
      <TopBar title="نقاطي" />

      {txLoading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Main Styles ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

// ─── Hero Styles ─────────────────────────────────────────

const heroStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  points: {
    fontSize: Fonts.sizes.title,
    fontWeight: Fonts.weights.bold,
    color: Colors.primary,
  },
  label: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

// ─── Stats Grid Styles ───────────────────────────────────

const statsGridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  loading: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

// ─── Section Styles ──────────────────────────────────────

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
});

// ─── Filter Styles ───────────────────────────────────────

const filterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.weights.semiBold,
  },
});

// ─── Transaction Card Styles ─────────────────────────────

const txStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  description: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  date: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  amountCol: {
    alignItems: 'flex-start',
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
  },
  balance: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export default PointsScreen;
