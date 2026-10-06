/**
 * Screen 2 – Student Detail (Dialog/Modal style via bottom sheet)
 * Opens when user taps a student card on Screen 1.
 */
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { StudentAvatar } from '@/components/StudentAvatar';
import { Colors, Spacing, ThemeColors } from '@/constants/theme';
import { useStudents } from '@/context/StudentContext';
import i18n from '@/i18n';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { students } = useStudents();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const student = students.find((s) => s.id === id);

  function openEdit() {
    router.replace({ pathname: '/student/form', params: { id } });
  }

  function goBack() {
    router.back();
  }

  if (!student) {
    return null;
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={goBack}>
      {/* Tap outside to close */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={goBack} />

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        {/* Handle bar */}
        <View style={[styles.handle, { backgroundColor: colors.backgroundElement }]} />

        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Avatar + name */}
          <View style={styles.avatarSection}>
            <StudentAvatar student={student} size={88} />
            <Text style={[styles.nameText, { color: colors.text }]}>{student.fullName}</Text>
            <Text style={[styles.idBadge]}>{student.studentId}</Text>
          </View>

          {/* Info rows */}
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundElement }]}>
            <InfoRow
              label={i18n.t('fullName')}
              value={student.fullName}
              colors={colors}
            />
            <InfoRow
              label={i18n.t('studentId')}
              value={student.studentId}
              colors={colors}
            />
            <InfoRow
              label={i18n.t('email')}
              value={student.email}
              colors={colors}
              last
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6366f1' }]}
              onPress={openEdit}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>✏️  {i18n.t('edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.backgroundElement }]}
              onPress={goBack}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>{i18n.t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  colors,
  last,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.backgroundElement },
      ]}
    >
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: Spacing.three,
    gap: 8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  idBadge: {
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  infoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 80,
    paddingTop: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
