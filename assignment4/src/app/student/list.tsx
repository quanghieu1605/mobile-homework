/**
 * Screen 1 – Student List
 * Shows all students with search, add (FAB), edit, delete actions.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StudentAvatar } from '@/components/StudentAvatar';
import { Colors, Spacing } from '@/constants/theme';
import { useStudents } from '@/context/StudentContext';
import i18n from '@/i18n';
import { Student } from '@/types/student';

export default function StudentListScreen() {
  const { students, loading, remove } = useStudents();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, search]);

  function handleDelete(student: Student) {
    setDeleteTarget(student);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  }

  function openDetail(student: Student) {
    router.push({ pathname: '/student/detail', params: { id: student.id } });
  }

  function openAdd() {
    router.push('/student/form');
  }

  function openEdit(student: Student) {
    router.push({ pathname: '/student/form', params: { id: student.id } });
  }

  const renderItem = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background, borderBottomColor: colors.backgroundElement }]}
      onPress={() => openDetail(item)}
      activeOpacity={0.7}
    >
      <StudentAvatar student={item} size={50} />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {item.fullName}
        </Text>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.studentId} · {item.email}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => openEdit(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: '#6366f1' }]}>
        <Text style={styles.headerTitle}>{i18n.t('studentList')}</Text>
        {!loading && (
          <Text style={styles.headerCount}>
            {i18n.t('totalStudents', { count: students.length })}
          </Text>
        )}
      </SafeAreaView>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={i18n.t('searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {students.length === 0
              ? i18n.t('noStudents')
              : '🔎 Không tìm thấy sinh viên phù hợp'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB – Add */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Delete confirm */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={i18n.t('confirmDelete')}
        message={i18n.t('confirmDeleteMsg', { name: deleteTarget?.fullName ?? '' })}
        confirmLabel={i18n.t('delete')}
        cancelLabel={i18n.t('no')}
        confirmDanger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: Platform.OS === 'android' ? Spacing.four : Spacing.two,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerCount: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.three,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: '#3b82f620',
  },
  deleteBtn: {
    backgroundColor: '#ef444420',
  },
  actionBtnText: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
});

