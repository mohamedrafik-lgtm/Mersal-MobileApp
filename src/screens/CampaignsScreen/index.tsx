/**
 * Campaigns Screen
 * List campaigns & create new ones with a multi-step modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts, Spacing } from '../../theme';
import { campaignService, dashboardService } from '../../services';
import type { Campaign, CreateCampaignRequest, Contact, Channel } from '../../services';
import TopBar from '../../components/TopBar';

// ─── Contact Picker Modal ────────────────────────────────

interface ContactPickerProps {
  visible: boolean;
  contacts: Contact[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClose: () => void;
  loading: boolean;
}

const ContactPickerModal: React.FC<ContactPickerProps> = ({
  visible,
  contacts,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onClose,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const filtered = contacts.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          {/* Header */}
          <View style={pickerStyles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={pickerStyles.headerTitle}>اختيار جهات الاتصال</Text>
          </View>

          {/* Search */}
          <View style={pickerStyles.searchRow}>
            <Icon name="magnify" size={20} color={Colors.textMuted} style={{ marginLeft: 8 }} />
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="بحث..."
              placeholderTextColor={Colors.textPlaceholder}
              value={search}
              onChangeText={setSearch}
              textAlign="right"
            />
          </View>

          {/* Select All / Deselect */}
          <View style={pickerStyles.bulkRow}>
            <TouchableOpacity onPress={onDeselectAll} style={pickerStyles.bulkBtn}>
              <Text style={pickerStyles.bulkBtnText}>إلغاء الكل</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSelectAll} style={[pickerStyles.bulkBtn, pickerStyles.bulkBtnPrimary]}>
              <Text style={[pickerStyles.bulkBtnText, { color: Colors.textLight }]}>تحديد الكل</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.countText}>{selected.length} / {contacts.length}</Text>
          </View>

          {/* List */}
          {loading ? (
            <View style={pickerStyles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[pickerStyles.contactRow, isSelected && pickerStyles.contactRowSelected]}
                    onPress={() => onToggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <View style={pickerStyles.contactInfo}>
                      <Text style={pickerStyles.contactName}>{item.name}</Text>
                      <Text style={pickerStyles.contactPhone}>{item.phone}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={pickerStyles.emptyBox}>
                  <Icon name="account-off-outline" size={40} color={Colors.textMuted} />
                  <Text style={pickerStyles.emptyText}>لا توجد جهات اتصال</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Done */}
          <TouchableOpacity style={pickerStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={pickerStyles.doneBtnText}>تم ({selected.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Create Campaign Modal ───────────────────────────────

interface CreateCampaignModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ visible, onClose, onDone }) => {
  // Form state
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [channelId, setChannelId] = useState('');
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [protectionType, setProtectionType] = useState('numbers');
  const [delayBetweenMessages, setDelayBetweenMessages] = useState('30');
  const [batchSize, setBatchSize] = useState('10');
  const [batchDelay, setBatchDelay] = useState('180');
  const [sendImageFirst, setSendImageFirst] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Data
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load channels & contacts when modal opens
  useEffect(() => {
    if (visible) {
      loadData();
    } else {
      // Reset on close (after animation)
      const t = setTimeout(() => {
        setName('');
        setMessage('');
        setChannelId('');
        setProtectionEnabled(false);
        setProtectionType('numbers');
        setDelayBetweenMessages('30');
        setBatchSize('10');
        setBatchDelay('180');
        setSendImageFirst(true);
        setSelectedContacts([]);
        setError('');
        setChannelPickerOpen(false);
        setContactPickerOpen(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [ch, ct] = await Promise.all([
        dashboardService.getChannels(),
        campaignService.getContacts(),
      ]);
      setChannels(ch);
      setContacts(ct);
      // Auto-select first connected channel
      const connected = ch.find(c => c.isConnected);
      if (connected) {
        setChannelId(connected.id);
      }
    } catch {
      // silent
    }
  };

  const selectedChannel = channels.find(c => c.id === channelId);

  const toggleContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const selectAllContacts = () => setSelectedContacts(contacts.map(c => c.id));
  const deselectAllContacts = () => setSelectedContacts([]);

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!name.trim()) {
      setError('يرجى إدخال اسم الحملة');
      return;
    }
    if (!message.trim()) {
      setError('يرجى إدخال نص الرسالة');
      return;
    }
    if (!channelId) {
      setError('يرجى اختيار قناة');
      return;
    }
    if (selectedContacts.length === 0) {
      setError('يرجى اختيار جهة اتصال واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCampaignRequest = {
        name: name.trim(),
        message: message.trim(),
        channelId,
        protectionEnabled,
        protectionType,
        delayBetweenMessages: parseInt(delayBetweenMessages, 10) || 30,
        batchSize: parseInt(batchSize, 10) || 10,
        batchDelay: parseInt(batchDelay, 10) || 180,
        sendImageFirst,
        contactIds: selectedContacts,
      };

      if (__DEV__) {
        console.log('[CreateCampaign] payload:', JSON.stringify(payload));
      }

      await campaignService.createCampaign(payload);
      onDone();
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'فشل إنشاء الحملة، حاول مرة أخرى';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={formStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={formStyles.container}>
          {/* Header */}
          <View style={formStyles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={formStyles.headerTitle}>إنشاء حملة جديدة</Text>
            <View style={formStyles.headerIcon}>
              <Icon name="send-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={formStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Campaign Name */}
            <Text style={formStyles.label}>اسم الحملة</Text>
            <TextInput
              style={formStyles.input}
              placeholder="مثال: حملة العروض الصيفية"
              placeholderTextColor={Colors.textPlaceholder}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />

            {/* Message */}
            <Text style={formStyles.label}>نص الرسالة</Text>
            <TextInput
              style={[formStyles.input, formStyles.textArea]}
              placeholder="اكتب نص الرسالة هنا... يمكنك استخدام {{name}} لاسم جهة الاتصال"
              placeholderTextColor={Colors.textPlaceholder}
              value={message}
              onChangeText={setMessage}
              textAlign="right"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Variable hint */}
            <View style={formStyles.hintRow}>
              <Icon name="information-outline" size={14} color={Colors.primary} />
              <Text style={formStyles.hintText}>استخدم {'{{name}}'} لإدراج اسم جهة الاتصال تلقائياً</Text>
            </View>

            {/* Channel Selector */}
            <Text style={formStyles.label}>القناة</Text>
            <TouchableOpacity
              style={formStyles.selectorBtn}
              onPress={() => setChannelPickerOpen(!channelPickerOpen)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-down" size={20} color={Colors.textMuted} />
              <Text style={[formStyles.selectorText, !selectedChannel && { color: Colors.textPlaceholder }]}>
                {selectedChannel
                  ? `${selectedChannel.name} (${selectedChannel.phoneNumber})`
                  : 'اختر قناة'}
              </Text>
              <Icon name="cellphone-link" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Channel dropdown */}
            {channelPickerOpen && (
              <View style={formStyles.dropdown}>
                {channels.length === 0 ? (
                  <Text style={formStyles.dropdownEmpty}>لا توجد قنوات متاحة</Text>
                ) : (
                  channels.map(ch => (
                    <TouchableOpacity
                      key={ch.id}
                      style={[
                        formStyles.dropdownItem,
                        ch.id === channelId && formStyles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setChannelId(ch.id);
                        setChannelPickerOpen(false);
                      }}
                    >
                      <View style={formStyles.dropdownItemRow}>
                        <Icon
                          name={ch.isConnected ? 'check-circle' : 'alert-circle-outline'}
                          size={16}
                          color={ch.isConnected ? Colors.success : Colors.warning}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={formStyles.dropdownItemText}>{ch.name}</Text>
                          <Text style={formStyles.dropdownItemSub}>{ch.phoneNumber}</Text>
                        </View>
                        {ch.id === channelId && (
                          <Icon name="check" size={18} color={Colors.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Contacts Selector */}
            <Text style={formStyles.label}>جهات الاتصال</Text>
            <TouchableOpacity
              style={formStyles.selectorBtn}
              onPress={() => {
                if (contacts.length === 0) {
                  setLoadingContacts(true);
                  campaignService.getContacts().then(ct => {
                    setContacts(ct);
                    setLoadingContacts(false);
                    setContactPickerOpen(true);
                  }).catch(() => {
                    setLoadingContacts(false);
                    setContactPickerOpen(true);
                  });
                } else {
                  setContactPickerOpen(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={20} color={Colors.textMuted} />
              <Text style={[formStyles.selectorText, selectedContacts.length === 0 && { color: Colors.textPlaceholder }]}>
                {selectedContacts.length > 0
                  ? `${selectedContacts.length} جهة اتصال محددة`
                  : 'اختر جهات الاتصال'}
              </Text>
              <Icon name="account-group-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Divider */}
            <View style={formStyles.divider} />

            {/* Advanced Settings Section */}
            <Text style={formStyles.sectionTitle}>إعدادات متقدمة</Text>

            {/* Send Image First */}
            <View style={formStyles.switchRow}>
              <Switch
                value={sendImageFirst}
                onValueChange={setSendImageFirst}
                trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                thumbColor={sendImageFirst ? Colors.primary : Colors.textMuted}
              />
              <Text style={formStyles.switchLabel}>إرسال الصورة أولاً</Text>
            </View>

            {/* Protection */}
            <View style={formStyles.switchRow}>
              <Switch
                value={protectionEnabled}
                onValueChange={setProtectionEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                thumbColor={protectionEnabled ? Colors.primary : Colors.textMuted}
              />
              <Text style={formStyles.switchLabel}>تفعيل الحماية</Text>
            </View>

            {protectionEnabled && (
              <View style={formStyles.protectionRow}>
                <TouchableOpacity
                  style={[formStyles.protectionOption, protectionType === 'numbers' && formStyles.protectionOptionActive]}
                  onPress={() => setProtectionType('numbers')}
                >
                  <Text style={[formStyles.protectionOptionText, protectionType === 'numbers' && formStyles.protectionOptionTextActive]}>
                    أرقام
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[formStyles.protectionOption, protectionType === 'names' && formStyles.protectionOptionActive]}
                  onPress={() => setProtectionType('names')}
                >
                  <Text style={[formStyles.protectionOptionText, protectionType === 'names' && formStyles.protectionOptionTextActive]}>
                    أسماء
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Numeric Settings */}
            <View style={formStyles.numericRow}>
              <View style={formStyles.numericItem}>
                <Text style={formStyles.numericLabel}>التأخير بين الرسائل (ث)</Text>
                <TextInput
                  style={formStyles.numericInput}
                  value={delayBetweenMessages}
                  onChangeText={setDelayBetweenMessages}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={formStyles.numericItem}>
                <Text style={formStyles.numericLabel}>حجم الدفعة</Text>
                <TextInput
                  style={formStyles.numericInput}
                  value={batchSize}
                  onChangeText={setBatchSize}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={formStyles.numericItem}>
                <Text style={formStyles.numericLabel}>تأخير الدفعة (ث)</Text>
                <TextInput
                  style={formStyles.numericInput}
                  value={batchDelay}
                  onChangeText={setBatchDelay}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={formStyles.errorBox}>
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={formStyles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[formStyles.submitBtn, isSubmitting && formStyles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.textLight} />
            ) : (
              <>
                <Icon name="send" size={18} color={Colors.textLight} />
                <Text style={formStyles.submitBtnText}>إنشاء الحملة</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Contact Picker Sub-modal */}
      <ContactPickerModal
        visible={contactPickerOpen}
        contacts={contacts}
        selected={selectedContacts}
        onToggle={toggleContact}
        onSelectAll={selectAllContacts}
        onDeselectAll={deselectAllContacts}
        onClose={() => setContactPickerOpen(false)}
        loading={loadingContacts}
      />
    </Modal>
  );
};

// ─── Delete Confirm Modal ────────────────────────────────

interface DeleteConfirmProps {
  visible: boolean;
  campaignName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({
  visible,
  campaignName,
  isDeleting,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={delStyles.overlay}>
      <View style={delStyles.card}>
        <View style={delStyles.iconCircle}>
          <Icon name="trash-can-outline" size={32} color={Colors.error} />
        </View>
        <Text style={delStyles.title}>حذف الحملة</Text>
        <Text style={delStyles.text}>
          هل أنت متأكد من حذف الحملة{'\n'}"{campaignName}"؟
        </Text>
        <View style={delStyles.actions}>
          <TouchableOpacity style={delStyles.cancelBtn} onPress={onCancel} disabled={isDeleting}>
            <Text style={delStyles.cancelBtnText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity style={delStyles.deleteBtn} onPress={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={delStyles.deleteBtnText}>حذف</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Campaign Card ───────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (campaign: Campaign) => void;
  onPress: (campaign: Campaign) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onDelete, onPress }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { icon: 'check-circle', color: Colors.success, bg: Colors.success + '20', label: 'مكتملة' };
      case 'running':
      case 'in_progress':
        return { icon: 'play-circle', color: '#3B82F6', bg: '#3B82F620', label: 'جارية' };
      case 'paused':
        return { icon: 'pause-circle', color: Colors.warning, bg: Colors.warning + '20', label: 'متوقفة' };
      case 'failed':
        return { icon: 'alert-circle', color: Colors.error, bg: Colors.error + '20', label: 'فشلت' };
      case 'draft':
        return { icon: 'file-edit-outline', color: Colors.textMuted, bg: Colors.textMuted + '20', label: 'مسودة' };
      default:
        return { icon: 'clock-outline', color: Colors.textSecondary, bg: Colors.textSecondary + '20', label: status };
    }
  };

  const statusConfig = getStatusConfig(campaign.status);
  const progress = campaign.totalCount > 0 ? (campaign.sentCount / campaign.totalCount) * 100 : 0;
  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => onPress(campaign)}
      activeOpacity={0.8}
    >
      {/* Header: Status Badge + Name */}
      <View style={cardStyles.cardHeader}>
        <View style={[cardStyles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
          <Text style={[cardStyles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
        <View style={cardStyles.nameSection}>
          <Text style={cardStyles.campaignName} numberOfLines={1}>{campaign.name}</Text>
          <View style={cardStyles.nameIconBox}>
            <Icon name="send-outline" size={16} color={Colors.textMuted} />
          </View>
        </View>
      </View>

      {/* Message Preview */}
      <Text style={cardStyles.messagePreview} numberOfLines={2}>
        {campaign.message}
      </Text>

      {/* Progress Bar */}
      <View style={cardStyles.progressSection}>
        <View style={cardStyles.progressBarBg}>
          <View style={[cardStyles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <View style={cardStyles.progressLabels}>
          <Text style={cardStyles.progressPercent}>{Math.round(progress)}%</Text>
          <Text style={cardStyles.progressCount}>
            {campaign.sentCount} / {campaign.totalCount}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={cardStyles.statsRow}>
        <View style={cardStyles.statItem}>
          <Icon name="check-circle-outline" size={14} color={Colors.success} />
          <Text style={[cardStyles.statValue, { color: Colors.success }]}>{campaign.sentCount}</Text>
          <Text style={cardStyles.statLabel}>مرسلة</Text>
        </View>
        <View style={cardStyles.statDot} />
        <View style={cardStyles.statItem}>
          <Icon name="alert-circle-outline" size={14} color={Colors.error} />
          <Text style={[cardStyles.statValue, { color: Colors.error }]}>{campaign.failedCount || 0}</Text>
          <Text style={cardStyles.statLabel}>فاشلة</Text>
        </View>
        <View style={cardStyles.statDot} />
        <View style={cardStyles.statItem}>
          <Icon name="calendar-outline" size={14} color={Colors.textMuted} />
          <Text style={cardStyles.statValue}>{formattedDate}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={cardStyles.actionsRow}>
        <TouchableOpacity
          style={cardStyles.deleteBtn}
          onPress={() => onDelete(campaign)}
          activeOpacity={0.7}
        >
          <Icon name="trash-can-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
        <View style={cardStyles.channelTag}>
          <Icon name="cellphone" size={14} color={Colors.textMuted} />
          <Text style={cardStyles.channelTagText}>
            {campaign.channel?.name || campaign.channelId.substring(0, 8)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────

const CampaignsScreen: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleCreateDone = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleDeletePress = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) { return; }
    setIsDeleting(true);
    try {
      await campaignService.deleteCampaign(campaignToDelete.id);
      setDeleteModalVisible(false);
      setCampaignToDelete(null);
      setRefreshing(true);
      fetchCampaigns();
    } catch (error: any) {
      const msg = error?.message || 'فشل حذف الحملة، حاول مرة أخرى';
      Alert.alert('خطأ', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setCampaignToDelete(null);
  };

  const handleCampaignPress = (_campaign: Campaign) => {
    // Future: navigate to campaign details
  };

  // Summary counts
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(
    c => c.status === 'running' || c.status === 'in_progress',
  ).length;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="send-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>لا توجد حملات</Text>
      <Text style={styles.emptyText}>
        أنشئ حملة جديدة لإرسال رسائل واتساب لجهات الاتصال
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />
      <TopBar title="الحملات" />

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={18} color={Colors.textLight} />
          <Text style={styles.addButtonText}>حملة جديدة</Text>
        </TouchableOpacity>

        <View style={styles.summaryInfo}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{totalCampaigns}</Text>
            <Text style={styles.summaryLabel}>إجمالي</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: Colors.primary }]}>
              {activeCampaigns}
            </Text>
            <Text style={styles.summaryLabel}>نشطة</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CampaignCard
              campaign={item}
              onDelete={handleDeletePress}
              onPress={handleCampaignPress}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            campaigns.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.backgroundCard}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onDone={handleCreateDone}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        campaignName={campaignToDelete?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </SafeAreaView>
  );
};

// ─── Main Styles ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    gap: 6,
  },
  addButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textLight,
  },
  summaryInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

// ─── Card Styles ─────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  nameIconBox: {
    width: 32,
    height: 32,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semiBold,
  },
  messagePreview: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  progressSection: {
    gap: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPercent: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.primary,
  },
  progressCount: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    color: Colors.textSecondary,
  },
  statLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.sm,
    gap: 4,
  },
  channelTagText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Form Modal Styles ───────────────────────────────────

const formStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textAlign: 'right',
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  hintRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  hintText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
  },
  selectorBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  selectorText: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  dropdown: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primary + '15',
  },
  dropdownItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dropdownItemText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  dropdownItemSub: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  dropdownEmpty: {
    padding: Spacing.base,
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  switchLabel: {
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  protectionRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  protectionOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
  },
  protectionOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  protectionOptionText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    color: Colors.textSecondary,
  },
  protectionOptionTextActive: {
    color: Colors.primary,
  },
  numericRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  numericItem: {
    flex: 1,
    alignItems: 'center',
  },
  numericLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  numericInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textPrimary,
    width: '100%',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.error,
    flex: 1,
    textAlign: 'right',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.base,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    gap: Spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
});

// ─── Contact Picker Styles ───────────────────────────────

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  bulkBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bulkBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bulkBtnText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textSecondary,
  },
  countText: {
    flex: 1,
    textAlign: 'right',
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textMuted,
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactRowSelected: {
    backgroundColor: Colors.primary + '10',
  },
  contactInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactName: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
});

// ─── Delete Modal Styles ─────────────────────────────────

const delStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: '#fff',
  },
});

export default CampaignsScreen;
