/**
 * Channels Screen
 * List connected WhatsApp channels & create new ones
 */

import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
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
  Clipboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (e) {
  if (__DEV__) { console.log('[QRCode] react-native-qrcode-svg not available, using Image fallback'); }
}
import { Colors, Fonts, Spacing } from '../../theme';
import { dashboardService } from '../../services';
import type { Channel, CreateChannelResponse } from '../../services';
import TopBar from '../../components/TopBar';

// ─── QR Renderer (uses SVG lib or Image fallback) ────────

const QRRenderer: React.FC<{ value: string; size: number }> = ({ value, size }) => {
  const [useFallback, setUseFallback] = useState(!QRCode);

  if (useFallback || !QRCode) {
    // Fallback: use a QR code generation API via Image
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
    return (
      <Image
        source={{ uri: apiUrl }}
        style={{ width: size, height: size, borderRadius: 8 }}
        resizeMode="contain"
      />
    );
  }

  try {
    return (
      <QRCode
        value={value}
        size={size}
        backgroundColor="#FFFFFF"
        color="#000000"
        onError={() => setUseFallback(true)}
      />
    );
  } catch {
    setUseFallback(true);
    return null;
  }
};

// ─── Channel Setup Modal (Create + QR in one modal) ─────

type SetupStep = 'form' | 'qr';

interface ChannelSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: () => void; // Called when flow completes (to refresh list)
}

const ChannelSetupModal: React.FC<ChannelSetupModalProps> = ({
  visible,
  onClose,
  onDone,
}) => {
  // ── Form state ──
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ── Step & QR state ──
  const [step, setStep] = useState<SetupStep>('form');
  const [channelData, setChannelData] = useState<CreateChannelResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset everything when modal visibility changes
  useEffect(() => {
    if (!visible) {
      // Delay reset to allow close animation
      const t = setTimeout(() => {
        setStep('form');
        setName('');
        setPhoneNumber('');
        setNameError('');
        setPhoneError('');
        setIsCreating(false);
        setChannelData(null);
        setPolling(false);
        setCopied(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // ── Poll for QR / connection status ──
  useEffect(() => {
    if (step !== 'qr' || !channelData?.id) {
      return;
    }

    setPolling(true);

    const poll = async () => {
      try {
        const updated = await dashboardService.getChannel(channelData.id);
        if (__DEV__) {
          console.log('[QR poll] updated:', JSON.stringify(updated));
        }
        setChannelData(updated);
        if (updated.status === 'connected' || updated.status === 'open') {
          setPolling(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // silent
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [step, channelData?.id]);

  // ── Form validation ──
  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError('اسم القناة مطلوب');
      valid = false;
    } else {
      setNameError('');
    }
    if (!phoneNumber.trim()) {
      setPhoneError('رقم الهاتف مطلوب');
      valid = false;
    } else if (phoneNumber.trim().length < 8) {
      setPhoneError('رقم الهاتف قصير جدا');
      valid = false;
    } else {
      setPhoneError('');
    }
    return valid;
  };

  // ── Create channel & switch to QR step ──
  const handleCreate = async () => {
    if (__DEV__) {
      console.log('[handleCreate] called, name:', name, 'phone:', phoneNumber);
    }
    if (!validate()) {
      if (__DEV__) {
        console.log('[handleCreate] validation failed');
      }
      return;
    }
    setIsCreating(true);
    try {
      if (__DEV__) {
        console.log('[handleCreate] calling API...');
      }
      const result = await dashboardService.createChannel({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      if (__DEV__) {
        console.log('[handleCreate] API success, result:', JSON.stringify(result));
        console.log('[handleCreate] qrCode:', result?.qrCode);
        console.log('[handleCreate] id:', result?.id);
      }
      setChannelData(result);
      setStep('qr'); // Switch to QR view inside the SAME modal
      if (__DEV__) {
        console.log('[handleCreate] step set to qr');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('[handleCreate] CATCH error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'فشل إنشاء القناة، حاول مرة أخرى';
      Alert.alert('خطأ', msg);
    } finally {
      setIsCreating(false);
    }
  };

  // ── Copy channel ID ──
  const handleCopyId = () => {
    if (channelData?.id) {
      Clipboard.setString(channelData.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Close & notify parent ──
  const handleDone = () => {
    onClose();
    onDone();
  };

  const handleCloseModal = () => {
    if (step === 'qr') {
      // If we already created a channel, refresh the list on close
      onClose();
      onDone();
    } else {
      onClose();
    }
  };

  const isConnected = channelData?.status === 'connected' || channelData?.status === 'open';
  const qrValue = channelData?.qrCode || channelData?.id || '';

  // ── Render Form Step ──
  const renderFormStep = () => (
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleCloseModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>إنشاء قناة جديدة</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>اسم القناة</Text>
          <View style={[styles.inputContainer, nameError ? styles.inputError : null]}>
            <Icon name="tag-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="مثال: قناة العملاء"
              placeholderTextColor={Colors.textPlaceholder}
              value={name}
              onChangeText={(t) => { setName(t); setNameError(''); }}
              editable={!isCreating}
              autoFocus
            />
          </View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>رقم الهاتف</Text>
          <View style={[styles.inputContainer, phoneError ? styles.inputError : null]}>
            <Icon name="phone-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputLtr]}
              placeholder="+966501234567"
              placeholderTextColor={Colors.textPlaceholder}
              value={phoneNumber}
              onChangeText={(t) => { setPhoneNumber(t); setPhoneError(''); }}
              keyboardType="phone-pad"
              editable={!isCreating}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.createBtn, isCreating && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator color={Colors.textLight} size="small" />
          ) : (
            <>
              <Icon name="plus" size={20} color={Colors.textLight} />
              <Text style={styles.createBtnText}>إنشاء القناة</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // ── Render QR Step ──
  const renderQrStep = () => (
    <View style={qrStyles.overlay}>
      <View style={qrStyles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={qrStyles.header}>
            <Text style={qrStyles.title}>الاتصال بـ WhatsApp</Text>
            <TouchableOpacity onPress={handleCloseModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={qrStyles.subtitle}>امسح QR Code للاتصال</Text>

          <View style={qrStyles.qrContainer}>
            {isConnected ? (
              <View style={qrStyles.connectedBox}>
                <Icon name="check-circle" size={64} color={Colors.success} />
                <Text style={qrStyles.connectedText}>تم الاتصال بنجاح!</Text>
              </View>
            ) : qrValue ? (
              <View style={qrStyles.qrBox}>
                <QRRenderer value={qrValue} size={200} />
              </View>
            ) : (
              <View style={qrStyles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={qrStyles.loadingText}>جاري تحميل QR Code...</Text>
              </View>
            )}
          </View>

          {!isConnected && (
            <View style={qrStyles.instructions}>
              <View style={qrStyles.stepRow}>
                <Text style={qrStyles.stepText}>افتح WhatsApp على هاتفك</Text>
                <Text style={qrStyles.stepNumber}>1.</Text>
              </View>
              <View style={qrStyles.stepRow}>
                <Text style={qrStyles.stepText}>{'اضغط على القائمة > الأجهزة المرتبطة'}</Text>
                <Text style={qrStyles.stepNumber}>2.</Text>
              </View>
              <View style={qrStyles.stepRow}>
                <Text style={qrStyles.stepText}>امسح QR Code أعلاه</Text>
                <Text style={qrStyles.stepNumber}>3.</Text>
              </View>
            </View>
          )}

          <View style={qrStyles.shareSection}>
            <Text style={qrStyles.shareTitle}>مشاركة الرابط</Text>
            <Text style={qrStyles.shareDesc}>
              شارك هذا الرابط مع الموظفين لربط حسابات WhatsApp الخاصة بهم مباشرة
            </Text>
            <View style={qrStyles.idRow}>
              <TouchableOpacity style={qrStyles.copyBtn} onPress={handleCopyId}>
                <Icon name={copied ? 'check' : 'content-copy'} size={18} color={Colors.textLight} />
              </TouchableOpacity>
              <View style={qrStyles.idBox}>
                <Text style={qrStyles.idText} numberOfLines={1}>
                  {channelData?.id || ''}
                </Text>
              </View>
            </View>
          </View>

          {isConnected && (
            <TouchableOpacity style={qrStyles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
              <Text style={qrStyles.doneBtnText}>تم</Text>
            </TouchableOpacity>
          )}

          {polling && !isConnected && (
            <View style={qrStyles.pollingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={qrStyles.pollingText}>في انتظار الاتصال...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      {step === 'form' ? renderFormStep() : renderQrStep()}
    </Modal>
  );
};

// ─── Delete Confirmation Modal ───────────────────────────

interface DeleteModalProps {
  visible: boolean;
  channelName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  visible,
  channelName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={delStyles.overlay}>
        <View style={delStyles.card}>
          {/* Icon */}
          <View style={delStyles.iconCircle}>
            <Icon name="trash-can-outline" size={32} color={Colors.error} />
          </View>

          {/* Title */}
          <Text style={delStyles.title}>حذف القناة</Text>

          {/* Message */}
          <Text style={delStyles.message}>
            هل أنت متأكد من حذف قناة{' '}
            <Text style={delStyles.channelName}>"{channelName}"</Text>
            ؟ {"\n"}هذا الإجراء لا يمكن التراجع عنه.
          </Text>

          {/* Buttons */}
          <View style={delStyles.buttonsRow}>
            <TouchableOpacity
              style={delStyles.cancelBtn}
              onPress={onCancel}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={delStyles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[delStyles.deleteBtn, isDeleting && delStyles.deleteBtnDisabled]}
              onPress={onConfirm}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <>
                  <Icon name="trash-can-outline" size={18} color={Colors.textLight} />
                  <Text style={delStyles.deleteBtnText}>حذف</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Reconnect QR Modal ─────────────────────────────────

interface ReconnectQRModalProps {
  visible: boolean;
  channelId: string;
  channelName: string;
  initialQr: string | null;
  onClose: () => void;
}

const ReconnectQRModal: React.FC<ReconnectQRModalProps> = ({
  visible,
  channelId,
  channelName,
  initialQr,
  onClose,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(initialQr);
  const [isConnected, setIsConnected] = useState(false);
  const [polling, setPolling] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setQrCode(initialQr);
    setIsConnected(false);
    setPolling(true);
  }, [initialQr, channelId]);

  useEffect(() => {
    if (!visible || !channelId) { return; }

    const poll = async () => {
      try {
        const updated = await dashboardService.getChannel(channelId);
        if (updated.qrCode) { setQrCode(updated.qrCode); }
        if (updated.status === 'connected' || updated.status === 'open') {
          setIsConnected(true);
          setPolling(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch { /* silent */ }
    };

    poll();
    pollingRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [visible, channelId]);

  const qrValue = qrCode || channelId || '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={qrStyles.overlay}>
        <View style={qrStyles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={qrStyles.header}>
              <Text style={qrStyles.title}>إعادة اتصال "{channelName}"</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={qrStyles.subtitle}>امسح QR Code لإعادة الاتصال</Text>

            <View style={qrStyles.qrContainer}>
              {isConnected ? (
                <View style={qrStyles.connectedBox}>
                  <Icon name="check-circle" size={64} color={Colors.success} />
                  <Text style={qrStyles.connectedText}>تم الاتصال بنجاح!</Text>
                </View>
              ) : qrValue ? (
                <View style={qrStyles.qrBox}>
                  <QRRenderer value={qrValue} size={200} />
                </View>
              ) : (
                <View style={qrStyles.loadingBox}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={qrStyles.loadingText}>جاري تحميل QR Code...</Text>
                </View>
              )}
            </View>

            {!isConnected && (
              <View style={qrStyles.instructions}>
                <View style={qrStyles.stepRow}>
                  <Text style={qrStyles.stepText}>افتح WhatsApp على هاتفك</Text>
                  <Text style={qrStyles.stepNumber}>1.</Text>
                </View>
                <View style={qrStyles.stepRow}>
                  <Text style={qrStyles.stepText}>{'اضغط على القائمة > الأجهزة المرتبطة'}</Text>
                  <Text style={qrStyles.stepNumber}>2.</Text>
                </View>
                <View style={qrStyles.stepRow}>
                  <Text style={qrStyles.stepText}>امسح QR Code أعلاه</Text>
                  <Text style={qrStyles.stepNumber}>3.</Text>
                </View>
              </View>
            )}

            {isConnected && (
              <TouchableOpacity style={qrStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={qrStyles.doneBtnText}>تم</Text>
              </TouchableOpacity>
            )}

            {polling && !isConnected && (
              <View style={qrStyles.pollingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={qrStyles.pollingText}>في انتظار الاتصال...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Channel Card ────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel;
  onDelete: (channel: Channel) => void;
  onReconnect: (channel: Channel) => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onDelete, onReconnect }) => {
  const isConnected = channel.isConnected;
  const statusColor = isConnected ? Colors.success : Colors.warning;
  const statusBg = isConnected ? Colors.success + '20' : Colors.warning + '20';
  const statusText = isConnected ? 'متصل' : channel.status === 'qr_pending' ? 'جاري الاتصال' : 'غير متصل';
  const statusIcon = isConnected ? 'check-circle' : 'sync';
  const connectionLabel = isConnected ? 'متصل' : 'غير متصل';

  const formattedDate = new Date(channel.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const lastConnectedText = channel.lastConnected
    ? new Date(channel.lastConnected).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    : 'لم يتصل بعد';

  return (
    <View style={cStyles.card}>
      {/* Top Section: Status Badge + Phone Number */}
      <View style={cStyles.cardHeader}>
        <View style={[cStyles.statusBadge, { backgroundColor: statusBg }]}>
          <Icon name={statusIcon} size={14} color={statusColor} />
          <Text style={[cStyles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <View style={cStyles.phoneSection}>
          <Text style={cStyles.phoneNumber}>{channel.phoneNumber}</Text>
          <View style={cStyles.phoneIconBox}>
            <Icon name="cellphone" size={18} color={Colors.textMuted} />
          </View>
        </View>
      </View>

      {/* Connection Status Label */}
      <Text style={[cStyles.connectionLabel, { color: isConnected ? Colors.success : Colors.error }]}>
        {connectionLabel}
      </Text>

      {/* Details Row */}
      <View style={cStyles.detailsRow}>
        <View style={cStyles.detailItem}>
          <Text style={cStyles.detailValue}>{lastConnectedText}</Text>
          <Text style={cStyles.detailLabel}>آخر اتصال</Text>
        </View>
        <View style={cStyles.detailItem}>
          <Text style={cStyles.detailValue}>{formattedDate}</Text>
          <Text style={cStyles.detailLabel}>تاريخ الإنشاء</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={cStyles.actionsRow}>
        <TouchableOpacity
          style={cStyles.deleteBtn}
          onPress={() => onDelete(channel)}
          activeOpacity={0.7}
        >
          <Icon name="trash-can-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
        <TouchableOpacity
          style={cStyles.reconnectBtn}
          onPress={() => onReconnect(channel)}
          activeOpacity={0.8}
        >
          <Icon name="sync" size={18} color={Colors.textLight} />
          <Text style={cStyles.reconnectBtnText}>إعادة الاتصال</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────

const ChannelsScreen: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [reconnectModalVisible, setReconnectModalVisible] = useState(false);
  const [reconnectChannel, setReconnectChannel] = useState<CreateChannelResponse | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const data = await dashboardService.getChannels();
      setChannels(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChannels();
  };

  const handleSetupDone = () => {
    setRefreshing(true);
    fetchChannels();
  };

  const handleReconnect = async (channel: Channel) => {
    try {
      // Fetch full channel data (with qrCode) then show QR modal
      const fullChannel = await dashboardService.getChannel(channel.id);
      setReconnectChannel(fullChannel);
      setReconnectModalVisible(true);
    } catch {
      Alert.alert('خطأ', 'فشل تحميل بيانات القناة');
    }
  };

  const handleReconnectClose = () => {
    setReconnectModalVisible(false);
    setReconnectChannel(null);
    setRefreshing(true);
    fetchChannels();
  };

  const handleDeletePress = (channel: Channel) => {
    setChannelToDelete(channel);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!channelToDelete) {return;}
    setIsDeleting(true);
    try {
      await dashboardService.deleteChannel(channelToDelete.id);
      setDeleteModalVisible(false);
      setChannelToDelete(null);
      setRefreshing(true);
      fetchChannels();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'فشل حذف القناة، حاول مرة أخرى';
      Alert.alert('خطأ', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setChannelToDelete(null);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="cellphone-link" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>لا توجد قنوات</Text>
      <Text style={styles.emptyText}>
        أنشئ قناة جديدة لربط رقم واتساب وبدء إرسال الحملات
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />
      <TopBar title="القنوات" />

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setSetupModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={18} color={Colors.textLight} />
          <Text style={styles.addButtonText}>قناة جديدة</Text>
        </TouchableOpacity>

        <View style={styles.summaryInfo}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{channels.length}</Text>
            <Text style={styles.summaryLabel}>إجمالي</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: Colors.success }]}>
              {channels.filter(c => c.isConnected).length}
            </Text>
            <Text style={styles.summaryLabel}>متصل</Text>
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
          data={channels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChannelCard
              channel={item}
              onDelete={handleDeletePress}
              onReconnect={handleReconnect}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            channels.length === 0 && styles.listEmpty,
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

      {/* Channel Setup Modal (Create + QR in one) */}
      <ChannelSetupModal
        visible={setupModalVisible}
        onClose={() => setSetupModalVisible(false)}
        onDone={handleSetupDone}
      />

      {/* Reconnect QR Modal */}
      {reconnectChannel && (
        <ReconnectQRModal
          visible={reconnectModalVisible}
          channelId={reconnectChannel.id}
          channelName={reconnectChannel.name}
          initialQr={reconnectChannel.qrCode}
          onClose={handleReconnectClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        channelName={channelToDelete?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  summaryCount: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  addButton: {
    flexDirection: 'row-reverse',
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

  // List
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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


  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },

  // Form fields
  fieldGroup: {
    marginBottom: Spacing.base,
  },
  fieldLabel: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.base,
    height: 50,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 0,
  },
  inputLtr: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  errorText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.error,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  createBtn: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    height: 50,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
});

// ─── Channel Card Styles ─────────────────────────────────

const cStyles = StyleSheet.create({
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
  phoneSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phoneIconBox: {
    width: 36,
    height: 36,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semiBold,
  },
  connectionLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    textAlign: 'right',
  },
  detailsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  detailItem: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  reconnectBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
    gap: 6,
  },
  reconnectBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textLight,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── QR Modal Styles ─────────────────────────────────────

const qrStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.xl,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xl,
  },
  loadingBox: {
    height: 248,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  connectedBox: {
    height: 248,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  connectedText: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.success,
  },
  instructions: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepNumber: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.primary,
    width: 20,
    textAlign: 'center',
  },
  stepText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  shareSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  shareTitle: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  shareDesc: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  idBox: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  idText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.sm,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  doneBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
  pollingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  pollingText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
});

// ─── Delete Modal Styles ─────────────────────────────────

const delStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.xl,
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
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  channelName: {
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
  },
  buttonsRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: Spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: Spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error,
    flexDirection: 'row-reverse',
    gap: 6,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textLight,
  },
});

export default ChannelsScreen;
