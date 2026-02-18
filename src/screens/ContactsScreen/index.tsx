/**
 * Contacts Screen
 * List contacts with search, pagination & create modal
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
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts, Spacing } from '../../theme';
import { contactService, dashboardService } from '../../services';
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../../services';
import type { Channel } from '../../services';
import TopBar from '../../components/TopBar';

const PAGE_LIMIT = 20;

// ─── Add Contact Modal ──────────────────────────────────

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  visible,
  onClose,
  onDone,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Channels
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const phoneRef = useRef<TextInput>(null);

  // Load channels when modal opens
  useEffect(() => {
    if (visible) {
      setLoadingChannels(true);
      dashboardService
        .getChannels()
        .then(ch => setChannels(Array.isArray(ch) ? ch : []))
        .catch(() => {})
        .finally(() => setLoadingChannels(false));
    } else {
      const t = setTimeout(() => {
        setName('');
        setPhone('');
        setNotes('');
        setNameError('');
        setPhoneError('');
        setSelectedChannelIds([]);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const toggleChannel = (id: string) => {
    setSelectedChannelIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    let valid = true;

    if (!name.trim()) {
      setNameError('اسم جهة الاتصال مطلوب');
      valid = false;
    } else {
      setNameError('');
    }

    if (!phone.trim()) {
      setPhoneError('رقم الهاتف مطلوب');
      valid = false;
    } else if (phone.trim().length < 8) {
      setPhoneError('يرجى إدخال رقم هاتف صالح');
      valid = false;
    } else {
      setPhoneError('');
    }

    if (!valid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateContactRequest = {
        name: name.trim(),
        phoneNumber: phone.trim(),
      };
      if (notes.trim()) {
        payload.notes = notes.trim();
      }
      if (selectedChannelIds.length > 0) {
        payload.channelIds = selectedChannelIds;
      }
      await contactService.createContact(payload);
      onDone();
      onClose();
    } catch (err: any) {
      Alert.alert(
        'خطأ',
        err.message || 'فشل إضافة جهة الاتصال، حاول مرة أخرى',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>إضافة جهة اتصال</Text>
            <View style={modalStyles.headerIcon}>
              <Icon name="account-plus-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={modalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Subtitle */}
            <Text style={modalStyles.subtitle}>أضف جهة اتصال جديدة يدوياً</Text>

            {/* Name */}
            <Text style={modalStyles.label}>الاسم</Text>
            <TextInput
              style={[modalStyles.input, nameError ? modalStyles.inputError : null]}
              placeholder="محمد أحمد"
              placeholderTextColor={Colors.textPlaceholder}
              value={name}
              onChangeText={t => {
                setName(t);
                if (nameError) { setNameError(''); }
              }}
              textAlign="right"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            {nameError ? <Text style={modalStyles.errorText}>{nameError}</Text> : null}

            {/* Phone */}
            <Text style={modalStyles.label}>رقم الهاتف (بالكود الدولي)</Text>
            <TextInput
              ref={phoneRef}
              style={[modalStyles.input, phoneError ? modalStyles.inputError : null]}
              placeholder="966501234567"
              placeholderTextColor={Colors.textPlaceholder}
              value={phone}
              onChangeText={t => {
                setPhone(t);
                if (phoneError) { setPhoneError(''); }
              }}
              textAlign="left"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            <Text style={modalStyles.hintText}>بدون علامة + ، مثال: 966501234567</Text>
            {phoneError ? <Text style={modalStyles.errorText}>{phoneError}</Text> : null}

            {/* Notes */}
            <Text style={modalStyles.label}>ملاحظات (اختياري)</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea]}
              placeholder="أضف ملاحظات حول جهة الاتصال..."
              placeholderTextColor={Colors.textPlaceholder}
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Channels (optional) */}
            <Text style={modalStyles.label}>القنوات المرتبطة (اختياري)</Text>
            {loadingChannels ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginVertical: Spacing.md }}
              />
            ) : channels.length === 0 ? (
              <Text style={modalStyles.noChannelsText}>لا توجد قنوات متاحة</Text>
            ) : (
              <View style={modalStyles.channelsList}>
                {channels.map(ch => {
                  const isSelected = selectedChannelIds.includes(ch.id);
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={modalStyles.channelRow}
                      onPress={() => toggleChannel(ch.id)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={22}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                      <View style={modalStyles.channelInfo}>
                        <Text style={modalStyles.channelName}>{ch.name}</Text>
                        {ch.phoneNumber ? (
                          <Text style={modalStyles.channelPhone}>{ch.phoneNumber}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <Text style={modalStyles.channelHint}>
              يمكنك اختيار قناة أو أكثر أو تركها فارغة
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={modalStyles.actions}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={modalStyles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitBtn, isSubmitting && modalStyles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={modalStyles.submitBtnText}>إضافة</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Delete Confirm Modal ────────────────────────────

interface EditContactModalProps {
  visible: boolean;
  contact: Contact | null;
  onClose: () => void;
  onDone: (updated: Contact) => void;
}

const EditContactModal: React.FC<EditContactModalProps> = ({
  visible,
  contact,
  onClose,
  onDone,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Channels
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const phoneRef = useRef<TextInput>(null);

  // Populate fields when modal opens
  useEffect(() => {
    if (visible && contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setNotes('');
      setNameError('');
      setPhoneError('');
      setSelectedChannelIds(
        contact.channels ? contact.channels.map(ch => ch.id) : [],
      );

      setLoadingChannels(true);
      dashboardService
        .getChannels()
        .then(ch => setChannels(Array.isArray(ch) ? ch : []))
        .catch(() => {})
        .finally(() => setLoadingChannels(false));
    } else if (!visible) {
      const t = setTimeout(() => {
        setName('');
        setPhone('');
        setNotes('');
        setNameError('');
        setPhoneError('');
        setSelectedChannelIds([]);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible, contact]);

  const toggleChannel = (id: string) => {
    setSelectedChannelIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!contact) { return; }
    let valid = true;

    if (!name.trim()) {
      setNameError('اسم جهة الاتصال مطلوب');
      valid = false;
    } else {
      setNameError('');
    }

    if (!phone.trim()) {
      setPhoneError('رقم الهاتف مطلوب');
      valid = false;
    } else if (phone.trim().length < 8) {
      setPhoneError('يرجى إدخال رقم هاتف صالح');
      valid = false;
    } else {
      setPhoneError('');
    }

    if (!valid) { return; }

    setIsSubmitting(true);
    try {
      const payload: UpdateContactRequest = {
        name: name.trim(),
        phoneNumber: phone.trim(),
      };
      if (notes.trim()) {
        payload.notes = notes.trim();
      }
      payload.channelIds = selectedChannelIds;
      const updated = await contactService.updateContact(contact.id, payload);
      onDone(updated);
      onClose();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل تعديل جهة الاتصال، حاول مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>تعديل جهة اتصال</Text>
            <View style={modalStyles.headerIcon}>
              <Icon name="account-edit-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={modalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={modalStyles.subtitle}>عدّل بيانات جهة الاتصال</Text>

            {/* Name */}
            <Text style={modalStyles.label}>الاسم</Text>
            <TextInput
              style={[modalStyles.input, nameError ? modalStyles.inputError : null]}
              placeholder="محمد أحمد"
              placeholderTextColor={Colors.textPlaceholder}
              value={name}
              onChangeText={t => {
                setName(t);
                if (nameError) { setNameError(''); }
              }}
              textAlign="right"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            {nameError ? <Text style={modalStyles.errorText}>{nameError}</Text> : null}

            {/* Phone */}
            <Text style={modalStyles.label}>رقم الهاتف (بالكود الدولي)</Text>
            <TextInput
              ref={phoneRef}
              style={[modalStyles.input, phoneError ? modalStyles.inputError : null]}
              placeholder="966501234567"
              placeholderTextColor={Colors.textPlaceholder}
              value={phone}
              onChangeText={t => {
                setPhone(t);
                if (phoneError) { setPhoneError(''); }
              }}
              textAlign="left"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            <Text style={modalStyles.hintText}>بدون علامة + ، مثال: 966501234567</Text>
            {phoneError ? <Text style={modalStyles.errorText}>{phoneError}</Text> : null}

            {/* Notes */}
            <Text style={modalStyles.label}>ملاحظات (اختياري)</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea]}
              placeholder="أضف ملاحظات حول جهة الاتصال..."
              placeholderTextColor={Colors.textPlaceholder}
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Channels (optional) */}
            <Text style={modalStyles.label}>القنوات المرتبطة (اختياري)</Text>
            {loadingChannels ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginVertical: Spacing.md }}
              />
            ) : channels.length === 0 ? (
              <Text style={modalStyles.noChannelsText}>لا توجد قنوات متاحة</Text>
            ) : (
              <View style={modalStyles.channelsList}>
                {channels.map(ch => {
                  const isSelected = selectedChannelIds.includes(ch.id);
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={modalStyles.channelRow}
                      onPress={() => toggleChannel(ch.id)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={22}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                      <View style={modalStyles.channelInfo}>
                        <Text style={modalStyles.channelName}>{ch.name}</Text>
                        {ch.phoneNumber ? (
                          <Text style={modalStyles.channelPhone}>{ch.phoneNumber}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <Text style={modalStyles.channelHint}>
              يمكنك اختيار قناة أو أكثر أو تركها فارغة
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={modalStyles.actions}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={modalStyles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitBtn, isSubmitting && modalStyles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={modalStyles.submitBtnText}>حفظ التعديلات</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Delete Confirm Modal ────────────────────────────────

interface DeleteContactModalProps {
  visible: boolean;
  contactName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteContactModal: React.FC<DeleteContactModalProps> = ({
  visible,
  contactName,
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
        <Text style={delStyles.title}>حذف جهة الاتصال</Text>
        <Text style={delStyles.text}>
          هل أنت متأكد من حذف{'\n'}"{contactName}"؟
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

// ─── Delete All Contacts Modal ───────────────────────────

interface DeleteAllContactsModalProps {
  visible: boolean;
  isDeleting: boolean;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteAllContactsModal: React.FC<DeleteAllContactsModalProps> = ({
  visible,
  isDeleting,
  totalCount,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={delAllStyles.overlay}>
      <View style={delAllStyles.card}>
        <View style={delAllStyles.iconCircle}>
          <Icon name="delete-sweep-outline" size={36} color={Colors.error} />
        </View>
        <Text style={delAllStyles.title}>حذف جميع جهات الاتصال</Text>
        <Text style={delAllStyles.text}>
          هل أنت متأكد من حذف جميع جهات الاتصال؟{"\n"}سيتم حذف{' '}
          <Text style={delAllStyles.highlight}>{totalCount}</Text> جهة اتصال نهائياً.{"\n"}
          لا يمكن التراجع عن هذا الإجراء.
        </Text>
        <View style={delAllStyles.warningBanner}>
          <Icon name="alert-outline" size={18} color={Colors.warning} />
          <Text style={delAllStyles.warningText}>تحذير: هذا الإجراء لا يمكن التراجع عنه</Text>
        </View>
        <View style={delAllStyles.actions}>
          <TouchableOpacity style={delAllStyles.cancelBtn} onPress={onCancel} disabled={isDeleting}>
            <Text style={delAllStyles.cancelBtnText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity style={delAllStyles.deleteBtn} onPress={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={delAllStyles.deleteBtnText}>حذف الكل</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Contact Card ────────────────────────────────────────

interface ContactCardProps {
  contact: Contact;
  onDelete: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onDelete, onEdit }) => {
  const initials = contact.name
    ? contact.name.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.row}>
        {/* Avatar */}
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={cardStyles.info}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={cardStyles.phone}>{contact.phone}</Text>
        </View>

        {/* Edit */}
        <TouchableOpacity
          onPress={() => onEdit(contact)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={cardStyles.editBtn}
        >
          <Icon name="pencil-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          onPress={() => onDelete(contact)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={cardStyles.deleteBtn}
        >
          <Icon name="trash-can-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Channels tags */}
      {contact.channels && contact.channels.length > 0 && (
        <View style={cardStyles.tagsRow}>
          {contact.channels.map(ch => (
            <View key={ch.id} style={cardStyles.tag}>
              <Icon name="cellphone-link" size={12} color={Colors.primary} />
              <Text style={cardStyles.tagText}>{ch.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────

const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAllVisible, setDeleteAllVisible] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);

  // Debounce timer for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContacts = useCallback(
    async (p: number = 1, searchQuery: string = '', append: boolean = false) => {
      try {
        const result = await contactService.getContacts({
          page: p,
          limit: PAGE_LIMIT,
          search: searchQuery || undefined,
        });
        if (append) {
          setContacts(prev => [...prev, ...result.data]);
        } else {
          setContacts(result.data);
        }
        setPage(result.page);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchContacts(1, '');
  }, [fetchContacts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchContacts(1, search);
  }, [fetchContacts, search]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) {
      return;
    }
    setLoadingMore(true);
    fetchContacts(page + 1, search, true);
  }, [loadingMore, page, totalPages, fetchContacts, search]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearch(text);
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      searchTimer.current = setTimeout(() => {
        setIsLoading(true);
        setPage(1);
        fetchContacts(1, text);
      }, 400);
    },
    [fetchContacts],
  );

  const handleDelete = useCallback(
    async () => {
      if (!deleteTarget) { return; }
      setIsDeleting(true);
      try {
        await contactService.deleteContact(deleteTarget.id);
        setContacts(prev => prev.filter(c => c.id !== deleteTarget.id));
        setTotal(prev => prev - 1);
        setDeleteTarget(null);
      } catch (err: any) {
        Alert.alert('خطأ', err.message || 'فشل حذف جهة الاتصال');
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTarget],
  );

  const handleDeleteAll = useCallback(async () => {
    setIsDeletingAll(true);
    try {
      await contactService.deleteAllContacts();
      setContacts([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setDeleteAllVisible(false);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل حذف جهات الاتصال');
    } finally {
      setIsDeletingAll(false);
    }
  }, []);

  const handleAddDone = useCallback(() => {
    // Refresh the list after adding
    setIsLoading(true);
    setPage(1);
    fetchContacts(1, search);
  }, [fetchContacts, search]);

  const handleEditDone = useCallback((updated: Contact) => {
    // Update the contact in the list locally
    setContacts(prev =>
      prev.map(c => (c.id === updated.id ? updated : c)),
    );
  }, []);

  // ─── Render ────────────────────────────────────────────

  const renderFooter = () => {
    if (!loadingMore) { return null; }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundSecondary} barStyle="light-content" />
      <TopBar title="جهات الاتصال" />

      {/* Search Bar + Add Button */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم أو رقم الهاتف..."
            placeholderTextColor={Colors.textPlaceholder}
            value={search}
            onChangeText={handleSearchChange}
            textAlign="right"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setIsLoading(true);
                setPage(1);
                fetchContacts(1, '');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={22} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Count + Delete All */}
      {!isLoading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {total} جهة اتصال
          </Text>
          {contacts.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllBtn}
              onPress={() => setDeleteAllVisible(true)}
              activeOpacity={0.7}
            >
              <Icon name="delete-sweep-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteAllText}>حذف الكل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Icon
              name={search ? 'account-search-outline' : 'account-group-outline'}
              size={64}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {search ? 'لا توجد نتائج' : 'لا توجد جهات اتصال'}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? `لم يتم العثور على جهات اتصال تطابق "${search}"`
                : 'أضف جهات اتصال جديدة للبدء في إرسال الحملات'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.8}
              >
                <Icon name="plus" size={18} color={Colors.textLight} />
                <Text style={styles.emptyAddBtnText}>إضافة جهة اتصال</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onDelete={setDeleteTarget}
              onEdit={setEditTarget}
            />
          )}
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
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onDone={handleAddDone}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        visible={!!editTarget}
        contact={editTarget}
        onClose={() => setEditTarget(null)}
        onDone={handleEditDone}
      />

      {/* Delete Confirm Modal */}
      <DeleteContactModal
        visible={!!deleteTarget}
        contactName={deleteTarget?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete All Contacts Modal */}
      <DeleteAllContactsModal
        visible={deleteAllVisible}
        isDeleting={isDeletingAll}
        totalCount={total}
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteAllVisible(false)}
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginLeft: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 0,
    marginHorizontal: Spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  countText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
    backgroundColor: Colors.error + '15',
  },
  deleteAllText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.error,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  emptyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: Fonts.sizes.xl,
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
    marginBottom: Spacing.lg,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  emptyAddBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textLight,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

// ─── Contact Card Styles ─────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.primary,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  phone: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  editBtn: {
    padding: Spacing.sm,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: Spacing.borderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  tagText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
    fontWeight: Fonts.weights.medium,
  },
});

// ─── Modal Styles ────────────────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    maxHeight: '90%',
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
  subtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
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
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  errorText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.error,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  hintText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  noChannelsText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  channelsList: {
    marginTop: Spacing.xs,
  },
  channelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  channelPhone: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  channelHint: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textPrimary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: Fonts.sizes.base,
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
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
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
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: '#fff',
  },
});

// ─── Delete All Modal Styles ─────────────────────────────

const delAllStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error + '15',
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
    lineHeight: 24,
    marginBottom: Spacing.base,
  },
  highlight: {
    fontWeight: Fonts.weights.bold,
    color: Colors.error,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '15',
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  warningText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    color: Colors.warning,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.textPrimary,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: '#fff',
  },
});

export default ContactsScreen;
