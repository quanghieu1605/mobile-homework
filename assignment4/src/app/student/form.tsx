/**
 * Screen 3 – Add / Edit Student Form
 * Opens when:
 *   - FAB "+" is pressed → add mode (no id param)
 *   - Edit button is pressed → edit mode (id param provided)
 */
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StudentAvatar } from '@/components/StudentAvatar';
import { Colors, Spacing, ThemeColors } from '@/constants/theme';
import { useStudents } from '@/context/StudentContext';
import i18n from '@/i18n';
import { isStudentIdTaken } from '@/services/studentStorage';
import { Student } from '@/types/student';

// ─── uuid shim for React Native ───────────────────────────────────────────────
// expo-crypto provides getRandomValues; import above handles it.

export default function StudentFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const { students, add, update } = useStudents();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Find existing student when editing
  const existing = isEdit ? students.find((s) => s.id === id) : undefined;

  // Form state
  const [fullName, setFullName] = useState(existing?.fullName ?? '');
  const [studentId, setStudentId] = useState(existing?.studentId ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [avatar, setAvatar] = useState(existing?.avatar ?? '');
  const [avatarUrl, setAvatarUrl] = useState(existing?.avatar?.startsWith('http') ? existing.avatar : '');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirm edit dialog
  const [showConfirm, setShowConfirm] = useState(false);

  // Update state when existing student loads (navigation)
  useEffect(() => {
    if (existing) {
      setFullName(existing.fullName);
      setStudentId(existing.studentId);
      setEmail(existing.email);
      setAvatar(existing.avatar);
      setAvatarUrl(existing.avatar?.startsWith('http') ? existing.avatar : '');
    }
  }, [existing?.id]);

  // ─── Validation ──────────────────────────────────────────────────────────────
  async function validate(): Promise<boolean> {
    const e: Record<string, string> = {};

    if (!fullName.trim()) e.fullName = i18n.t('requiredField');
    if (!studentId.trim()) {
      e.studentId = i18n.t('requiredField');
    } else {
      const taken = await isStudentIdTaken(studentId.trim(), isEdit ? id : undefined);
      if (taken) e.studentId = i18n.t('duplicateId');
    }
    if (!email.trim()) {
      e.email = i18n.t('requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = i18n.t('invalidEmail');
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Image picker ─────────────────────────────────────────────────────────────
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to the photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
      setAvatarUrl('');
    }
  }

  // When URL changes, use it as avatar
  function handleUrlChange(val: string) {
    setAvatarUrl(val);
    if (val.trim()) setAvatar(val.trim());
    else setAvatar('');
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const ok = await validate();
    if (!ok) return;
    if (isEdit) {
      setShowConfirm(true);
    } else {
      await doSave();
    }
  }

  async function doSave() {
    const student: Student = {
      id: isEdit ? id! : Crypto.randomUUID(),
      studentId: studentId.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      avatar: avatar.trim(),
      createdAt: existing?.createdAt ?? Date.now(),
    };

    if (isEdit) {
      await update(student);
    } else {
      await add(student);
    }
    router.back();
  }

  // ─── Preview avatar ───────────────────────────────────────────────────────────
  const previewStudent: Student = {
    id: 'preview',
    studentId,
    fullName,
    email,
    avatar,
    createdAt: 0,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: '#6366f1' }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>‹ {i18n.t('cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? i18n.t('editStudent') : i18n.t('addStudent')}
        </Text>
        <View style={{ width: 60 }} />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.avatarPreview}
                onError={() => setAvatar('')}
              />
            ) : (
              <View style={[styles.avatarPreview, styles.avatarPlaceholder]}>
                <StudentAvatar student={previewStudent} size={80} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={{ fontSize: 18 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            <Text style={[styles.pickLabel, { color: '#6366f1' }]}>
              {i18n.t('pickImage')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar URL */}
        <FormField
          label={i18n.t('avatarUrl')}
          value={avatarUrl}
          onChangeText={handleUrlChange}
          placeholder={i18n.t('enterAvatarUrl')}
          colors={colors}
          error={errors.avatar}
          keyboardType="url"
          autoCapitalize="none"
        />

        {/* Full name */}
        <FormField
          label={`${i18n.t('fullName')} *`}
          value={fullName}
          onChangeText={setFullName}
          placeholder={i18n.t('enterFullName')}
          colors={colors}
          error={errors.fullName}
          autoCapitalize="words"
        />

        {/* Student ID */}
        <FormField
          label={`${i18n.t('studentId')} *`}
          value={studentId}
          onChangeText={setStudentId}
          placeholder={i18n.t('enterStudentId')}
          colors={colors}
          error={errors.studentId}
          autoCapitalize="characters"
        />

        {/* Email */}
        <FormField
          label="Email *"
          value={email}
          onChangeText={setEmail}
          placeholder={i18n.t('enterEmail')}
          colors={colors}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: '#6366f1' }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>💾  {i18n.t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit confirmation dialog */}
      <ConfirmDialog
        visible={showConfirm}
        title={i18n.t('confirmEdit')}
        message={i18n.t('confirmEditMsg', { name: fullName })}
        confirmLabel={i18n.t('edit')}
        cancelLabel={i18n.t('no')}
        confirmDanger={false}
        onConfirm={async () => {
          setShowConfirm(false);
          await doSave();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Reusable form field ──────────────────────────────────────────────────────
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  error,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: ThemeColors;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'url';
  autoCapitalize?: 'none' | 'words' | 'characters' | 'sentences';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          {
            backgroundColor: colors.backgroundElement,
            color: colors.text,
            borderColor: error ? '#ef4444' : 'transparent',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: Platform.OS === 'android' ? Spacing.four : Spacing.two,
  },
  backText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    width: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pickLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldWrap: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  fieldInput: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 14,
    borderWidth: 1.5,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 4,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
