import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  EMAIL_REGEX,
  Language,
  MSSV_REGEX,
  Student,
  getStoredLanguage,
  loadStudents,
  saveStudents,
  setStoredLanguage,
  translations,
} from '@/services/studentData';

// Color palette for initials avatar fallback
const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#2563EB', '#0D9488',
  '#059669', '#D97706', '#DC2626', '#DB2777',
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StudentManagementApp() {
  // Current language state (Default Vietnamese)
  const [lang, setLang] = useState<Language>('vi');
  const t = translations[lang];

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Screen state: 'list' (Trang 1: Danh sách) | 'form' (Trang 3: Thêm / Sửa)
  const [currentScreen, setCurrentScreen] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Trang 2: Chi tiết sinh viên (Dialog Modal)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // Form states (Trang 3)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputId, setInputId] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputAvatar, setInputAvatar] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmation Dialog states (Bắt buộc theo đề bài)
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    type: 'delete' | 'edit_save' | 'edit_request';
    targetStudent?: Student;
  }>({ visible: false, type: 'delete' });

  // Load language and students on mount
  useEffect(() => {
    async function init() {
      const initialLang = await getStoredLanguage();
      setLang(initialLang);
      const data = await loadStudents();
      setStudents(data);
      setLoading(false);
    }
    init();
  }, []);

  // Language toggle handler
  const handleToggleLanguage = async () => {
    const nextLang: Language = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
    await setStoredLanguage(nextLang);
  };

  // Open Trang 3: Add new student
  const handleOpenAdd = () => {
    setFormMode('add');
    setEditingStudentId(null);
    setInputName('');
    setInputId('');
    setInputEmail('');
    setInputAvatar('');
    setFormErrors({});
    setCurrentScreen('form');
  };

  // Open Trang 3: Request edit student (triggers confirmation dialog first)
  const handleRequestEdit = (student: Student) => {
    setConfirmDialog({
      visible: true,
      type: 'edit_request',
      targetStudent: student,
    });
  };

  const handleExecuteOpenEdit = (student: Student) => {
    setFormMode('edit');
    setEditingStudentId(student.id);
    setInputName(student.fullName);
    setInputId(student.studentId);
    setInputEmail(student.email);
    setInputAvatar(student.avatar);
    setFormErrors({});
    if (detailStudent) {
      setDetailStudent(null);
    }
    setCurrentScreen('form');
  };

  // Request delete student (triggers confirmation dialog first)
  const handleRequestDelete = (student: Student) => {
    setConfirmDialog({
      visible: true,
      type: 'delete',
      targetStudent: student,
    });
  };

  // Execute delete student after user clicks "Có"
  const handleExecuteDelete = async (studentIdToDelete: string) => {
    const nextList = students.filter((s) => s.id !== studentIdToDelete);
    setStudents(nextList);
    await saveStudents(nextList);
    if (detailStudent?.id === studentIdToDelete) {
      setDetailStudent(null);
    }
  };

  // Image Picker from device
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          lang === 'vi' ? 'Quyền truy cập' : 'Permission Required',
          lang === 'vi'
            ? 'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.'
            : 'Please grant access to your photo library to proceed.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setInputAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Pick image error', e);
    }
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!inputName.trim()) {
      errs.name = t.errNameRequired;
    }

    const trimmedId = inputId.trim().toUpperCase();
    if (!trimmedId) {
      errs.id = t.errIdRequired;
    } else if (!MSSV_REGEX.test(trimmedId)) {
      errs.id = t.errIdFormat;
    } else {
      const isDuplicate = students.some(
        (s) =>
          s.studentId.trim().toUpperCase() === trimmedId &&
          s.id !== editingStudentId
      );
      if (isDuplicate) {
        errs.id = t.errIdExists;
      }
    }

    const trimmedEmail = inputEmail.trim();
    if (!trimmedEmail) {
      errs.email = t.errEmailRequired;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = t.errEmailInvalid;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submit handler
  const handleSubmitForm = () => {
    if (!validateForm()) return;

    if (formMode === 'edit') {
      // Yêu cầu xác nhận trước khi sửa thông tin
      setConfirmDialog({
        visible: true,
        type: 'edit_save',
      });
    } else {
      executeSaveStudent();
    }
  };

  // Execute save to local AsyncStorage
  const executeSaveStudent = async () => {
    if (formMode === 'add') {
      const newStudent: Student = {
        id: 'sv-' + Date.now().toString(),
        studentId: inputId.trim().toUpperCase(),
        fullName: inputName.trim(),
        email: inputEmail.trim().toLowerCase(),
        avatar: inputAvatar.trim(),
        createdAt: Date.now(),
      };
      const updated = [newStudent, ...students];
      setStudents(updated);
      await saveStudents(updated);
    } else if (formMode === 'edit' && editingStudentId) {
      const updated = students.map((s) => {
        if (s.id === editingStudentId) {
          return {
            ...s,
            studentId: inputId.trim().toUpperCase(),
            fullName: inputName.trim(),
            email: inputEmail.trim().toLowerCase(),
            avatar: inputAvatar.trim(),
          };
        }
        return s;
      });
      setStudents(updated);
      await saveStudents(updated);
    }

    setCurrentScreen('list');
  };

  // Render individual student card in list (Trang 1)
  const renderStudentItem = ({ item }: { item: Student }) => {
    const avatarColor = getAvatarColor(item.fullName || item.studentId);
    const initials = getInitials(item.fullName || item.studentId);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => setDetailStudent(item)}
      >
        {/* Left Side: Avatar */}
        <View style={styles.cardAvatarWrapper}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.cardAvatarImage} />
          ) : (
            <View style={[styles.cardAvatarFallback, { backgroundColor: avatarColor }]}>
              <Text style={styles.cardAvatarText}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Center: Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.fullName}
          </Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>{item.studentId}</Text>
            </View>
          </View>
          <Text style={styles.cardEmail} numberOfLines={1}>
            ✉️ {item.email}
          </Text>
        </View>

        {/* Right Side: Action buttons (Sửa / Xóa) */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.btnActionEdit}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              handleRequestEdit(item);
            }}
          >
            <Text style={styles.btnActionEditText}>✏️ {t.edit}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnActionDelete}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              handleRequestDelete(item);
            }}
          >
            <Text style={styles.btnActionDeleteText}>🗑️ {t.delete}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4338CA" />

      {/* ========================================================================= */}
      {/* SCREEN 1: DANH SÁCH SINH VIÊN (TRANG 1)                                   */}
      {/* ========================================================================= */}
      {currentScreen === 'list' && (
        <View style={styles.container}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleGroup}>
                <Text style={styles.headerAppTitle}>🎓 {t.appName}</Text>
                <Text style={styles.headerTagline}>{t.tagline}</Text>
              </View>

              {/* Language Switch Button */}
              <TouchableOpacity
                style={styles.langBadge}
                activeOpacity={0.75}
                onPress={handleToggleLanguage}
              >
                <Text style={styles.langBadgeIcon}>{lang === 'vi' ? '🇻🇳' : '🇬🇧'}</Text>
                <Text style={styles.langBadgeText}>{lang.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* Total count badge */}
            <View style={styles.headerStatsRow}>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  📋 {t.studentCount.replace('{count}', students.length.toString())}
                </Text>
              </View>
            </View>
          </View>

          {/* List Content */}
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : students.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>{t.noStudents}</Text>
              <Text style={styles.emptySubtitle}>{t.noStudentsHint}</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Bottom Add Button (Theo đúng mẫu thiết kế bảng vẽ "Thêm / Create") */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.btnAddBottom}
              activeOpacity={0.88}
              onPress={handleOpenAdd}
            >
              <Text style={styles.btnAddBottomIcon}>➕</Text>
              <Text style={styles.btnAddBottomText}>{t.addStudent}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: THÊM MỚI / CHỈNH SỬA SINH VIÊN (TRANG 3 - EDITABLE)            */}
      {/* ========================================================================= */}
      {currentScreen === 'form' && (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Form Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity
              style={styles.formHeaderBack}
              onPress={() => setCurrentScreen('list')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.formHeaderBackText}>‹ {t.cancel}</Text>
            </TouchableOpacity>
            <Text style={styles.formHeaderTitle}>
              {formMode === 'add' ? `➕ ${t.addStudent}` : `✏️ ${t.editStudent}`}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Preview & Picker Card */}
            <View style={styles.avatarPickerCard}>
              <View style={styles.avatarPreviewCircle}>
                {inputAvatar ? (
                  <Image source={{ uri: inputAvatar }} style={styles.avatarPreviewImage} />
                ) : (
                  <View
                    style={[
                      styles.avatarPreviewFallback,
                      { backgroundColor: getAvatarColor(inputName || inputId || 'New') },
                    ]}
                  >
                    <Text style={styles.avatarPreviewFallbackText}>
                      {inputName ? getInitials(inputName) : 'SV'}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.btnPickImage}
                activeOpacity={0.8}
                onPress={handlePickImage}
              >
                <Text style={styles.btnPickImageText}>📷 {t.pickFromGallery}</Text>
              </TouchableOpacity>
              <Text style={styles.avatarPickerSub}>{t.orEnterUrl}</Text>
            </View>

            {/* Input: Avatar URL */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🔗 {t.avatarUrl}</Text>
              <TextInput
                style={[styles.inputField, formErrors.avatar && styles.inputFieldError]}
                placeholder={t.enterAvatarUrl}
                placeholderTextColor="#94A3B8"
                value={inputAvatar}
                onChangeText={setInputAvatar}
                autoCapitalize="none"
              />
            </View>

            {/* Input: Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>👤 {t.fullName} *</Text>
              <TextInput
                style={[styles.inputField, formErrors.name && styles.inputFieldError]}
                placeholder={t.enterFullName}
                placeholderTextColor="#94A3B8"
                value={inputName}
                onChangeText={(text) => {
                  setInputName(text);
                  if (formErrors.name) setFormErrors((e) => ({ ...e, name: '' }));
                }}
                autoCapitalize="words"
              />
              {!!formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            {/* Input: Student ID (MSSV) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🏷️ {t.studentId} *</Text>
              <TextInput
                style={[styles.inputField, formErrors.id && styles.inputFieldError]}
                placeholder={t.enterStudentId}
                placeholderTextColor="#94A3B8"
                value={inputId}
                maxLength={9}
                onChangeText={(text) => {
                  const upper = text.toUpperCase();
                  setInputId(upper);
                  if (formErrors.id) setFormErrors((e) => ({ ...e, id: '' }));
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                📌 Định dạng 9 ký tự: Chữ 'B' + 2 chữ cái A-Z + 2 số từ 22-26 + 4 số cuối 0-9 (VD: BCN240001)
              </Text>
              {!!formErrors.id && (
                <Text style={styles.errorText}>{formErrors.id}</Text>
              )}
            </View>

            {/* Input: Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📧 {t.email} *</Text>
              <TextInput
                style={[styles.inputField, formErrors.email && styles.inputFieldError]}
                placeholder={t.enterEmail}
                placeholderTextColor="#94A3B8"
                value={inputEmail}
                onChangeText={(text) => {
                  const trimmed = text.trim();
                  setInputEmail(trimmed);
                  if (formErrors.email) setFormErrors((e) => ({ ...e, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                📌 Ví dụ: sinhvien@gmail.com hoặc student@ptit.edu.vn
              </Text>
              {!!formErrors.email && (
                <Text style={styles.errorText}>{formErrors.email}</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.formButtonRow}>
              <TouchableOpacity
                style={styles.btnFormCancel}
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('list')}
              >
                <Text style={styles.btnFormCancelText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnFormSave}
                activeOpacity={0.88}
                onPress={handleSubmitForm}
              >
                <Text style={styles.btnFormSaveText}>💾 {t.save}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: HỘP THOẠI CHI TIẾT SINH VIÊN (TRANG 2 - DIALOG)                 */}
      {/* ========================================================================= */}
      <Modal
        visible={!!detailStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailStudent(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailStudent(null)}
        >
          <View style={styles.detailDialogCard} onStartShouldSetResponder={() => true}>
            {/* Dialog Close Button */}
            <TouchableOpacity
              style={styles.dialogCloseButton}
              onPress={() => setDetailStudent(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.dialogCloseText}>✕</Text>
            </TouchableOpacity>

            {detailStudent && (
              <>
                {/* Avatar Centered */}
                <View style={styles.dialogAvatarWrapper}>
                  {detailStudent.avatar ? (
                    <Image source={{ uri: detailStudent.avatar }} style={styles.dialogAvatarImage} />
                  ) : (
                    <View
                      style={[
                        styles.dialogAvatarFallback,
                        { backgroundColor: getAvatarColor(detailStudent.fullName) },
                      ]}
                    >
                      <Text style={styles.dialogAvatarText}>
                        {getInitials(detailStudent.fullName)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Name & ID Header */}
                <Text style={styles.dialogFullName}>{detailStudent.fullName}</Text>
                <View style={styles.dialogIdBadge}>
                  <Text style={styles.dialogIdBadgeText}>{detailStudent.studentId}</Text>
                </View>

                {/* Info Fields Rows */}
                <View style={styles.dialogInfoContainer}>
                  <View style={styles.dialogInfoRow}>
                    <Text style={styles.dialogInfoLabel}>👤 {t.fullName}:</Text>
                    <Text style={styles.dialogInfoValue}>{detailStudent.fullName}</Text>
                  </View>

                  <View style={styles.dialogInfoRow}>
                    <Text style={styles.dialogInfoLabel}>🏷️ {t.studentId}:</Text>
                    <Text style={styles.dialogInfoValue}>{detailStudent.studentId}</Text>
                  </View>

                  <View style={styles.dialogInfoRow}>
                    <Text style={styles.dialogInfoLabel}>📧 {t.email}:</Text>
                    <Text style={styles.dialogInfoValue}>{detailStudent.email}</Text>
                  </View>

                  <View style={[styles.dialogInfoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.dialogInfoLabel}>📅 {t.joinedDate}:</Text>
                    <Text style={styles.dialogInfoValue}>
                      {new Date(detailStudent.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Actions row inside Dialog */}
                <View style={styles.dialogActionsRow}>
                  {/* Edit Button */}
                  <TouchableOpacity
                    style={styles.btnDialogEdit}
                    activeOpacity={0.8}
                    onPress={() => handleRequestEdit(detailStudent)}
                  >
                    <Text style={styles.btnDialogEditText}>✏️ {t.edit}</Text>
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.btnDialogDelete}
                    activeOpacity={0.8}
                    onPress={() => handleRequestDelete(detailStudent)}
                  >
                    <Text style={styles.btnDialogDeleteText}>🗑️ {t.delete}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* CONFIRMATION DIALOG (Yêu cầu bắt buộc: Xác nhận khi Sửa / Xóa)           */}
      {/* ========================================================================= */}
      <Modal
        visible={confirmDialog.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDialog({ visible: false, type: 'delete' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <View
              style={[
                styles.confirmIconBadge,
                confirmDialog.type === 'delete'
                  ? styles.confirmIconDelete
                  : styles.confirmIconEdit,
              ]}
            >
              <Text style={styles.confirmIconEmoji}>
                {confirmDialog.type === 'delete' ? '🗑️' : '✏️'}
              </Text>
            </View>

            <Text style={styles.confirmTitle}>
              {confirmDialog.type === 'delete'
                ? t.confirmDeleteTitle
                : t.confirmEditTitle}
            </Text>

            <Text style={styles.confirmMessage}>
              {confirmDialog.type === 'delete'
                ? t.confirmDeleteMsg
                : t.confirmEditMsg}
            </Text>

            <View style={styles.confirmButtonsRow}>
              {/* Nút Không */}
              <TouchableOpacity
                style={styles.btnConfirmCancel}
                activeOpacity={0.8}
                onPress={() => setConfirmDialog({ visible: false, type: 'delete' })}
              >
                <Text style={styles.btnConfirmCancelText}>{t.no}</Text>
              </TouchableOpacity>

              {/* Nút Có */}
              <TouchableOpacity
                style={[
                  styles.btnConfirmYes,
                  confirmDialog.type === 'delete'
                    ? styles.btnConfirmYesDelete
                    : styles.btnConfirmYesEdit,
                ]}
                activeOpacity={0.8}
                onPress={async () => {
                  const { type, targetStudent } = confirmDialog;
                  setConfirmDialog({ visible: false, type: 'delete' });

                  if (type === 'delete' && targetStudent) {
                    await handleExecuteDelete(targetStudent.id);
                  } else if (type === 'edit_request' && targetStudent) {
                    handleExecuteOpenEdit(targetStudent);
                  } else if (type === 'edit_save') {
                    await executeSaveStudent();
                  }
                }}
              >
                <Text style={styles.btnConfirmYesText}>{t.yes}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4338CA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* Header Banner */
  headerBanner: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerAppTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerTagline: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 2,
    fontWeight: '500',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  langBadgeIcon: {
    fontSize: 14,
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  countPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countPillText: {
    color: '#EEF2FF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* List & Cards */
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardAvatarWrapper: {
    marginRight: 12,
  },
  cardAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  cardAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  cardAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  idBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  idBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardEmail: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
  },
  btnActionEdit: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  btnActionEditText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionDelete: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnActionDeleteText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Empty State */
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  /* Bottom Add Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  btnAddBottom: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    gap: 8,
  },
  btnAddBottomIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  btnAddBottomText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* ======================================================= */
  /* SCREEN 3: FORM STYLES                                   */
  /* ======================================================= */
  formHeader: {
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
  },
  formHeaderBack: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  formHeaderBackText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  formHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  formScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  formScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarPreviewCircle: {
    marginBottom: 12,
  },
  avatarPreviewImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  avatarPreviewFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  avatarPreviewFallbackText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  btnPickImage: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  btnPickImageText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarPickerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  inputFieldError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btnFormCancel: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnFormCancelText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  btnFormSave: {
    flex: 2,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnFormSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ======================================================= */
  /* SCREEN 2: DETAIL DIALOG STYLES                          */
  /* ======================================================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailDialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  dialogCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dialogCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  dialogAvatarWrapper: {
    marginTop: 8,
    marginBottom: 12,
  },
  dialogAvatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  dialogAvatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  dialogAvatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  dialogFullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  dialogIdBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 18,
  },
  dialogIdBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dialogInfoContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dialogInfoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dialogInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  dialogInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dialogActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btnDialogEdit: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDialogEditText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDialogDelete: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnDialogDeleteText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },

  /* ======================================================= */
  /* CONFIRM DIALOG STYLES                                   */
  /* ======================================================= */
  confirmBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  confirmIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmIconDelete: {
    backgroundColor: '#FEE2E2',
  },
  confirmIconEdit: {
    backgroundColor: '#EEF2FF',
  },
  confirmIconEmoji: {
    fontSize: 26,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btnConfirmCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnConfirmCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  btnConfirmYes: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnConfirmYesDelete: {
    backgroundColor: '#DC2626',
  },
  btnConfirmYesEdit: {
    backgroundColor: '#4F46E5',
  },
  btnConfirmYesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
