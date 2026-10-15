import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCourses,
  updateCategory,
} from "../../services/api";
import type { Category } from "../../types/category";
import type { Course } from "../../types/course";

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modal State Thêm / Sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal State Xóa & Cảnh báo ràng buộc
  const [deleteTargetCategory, setDeleteTargetCategory] =
    useState<Category | null>(null);
  const [blockedDeleteCount, setBlockedDeleteCount] = useState<number | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  async function loadData(isRefresh = false, isSilent = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      setError("");

      const [catData, courseData] = await Promise.all([
        getCategories(),
        getCourses(),
      ]);

      setCategories(catData);
      setCourses(courseData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh mục."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      const isInitial = categories.length === 0;
      loadData(false, !isInitial);
    }, [])
  );

  function openCreateModal() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDesc("");
    setModalVisible(true);
  }

  function openEditModal(item: Category) {
    setEditingCategory(item);
    setCategoryName(item.name);
    setCategoryDesc(item.description);
    setModalVisible(true);
  }

  async function handleSaveCategory() {
    if (!categoryName.trim()) {
      if (Platform.OS === "web") {
        window.alert("Vui lòng nhập tên danh mục.");
      } else {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập tên danh mục.");
      }
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        // Cập nhật
        await updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          description: categoryDesc.trim(),
        });
        if (Platform.OS === "web") {
          window.alert("Đã cập nhật danh mục thành công.");
        } else {
          Alert.alert("Thành công", "Đã cập nhật danh mục.");
        }
      } else {
        // Thêm mới
        await createCategory({
          name: categoryName.trim(),
          description: categoryDesc.trim(),
        });
        if (Platform.OS === "web") {
          window.alert("Đã thêm danh mục mới thành công.");
        } else {
          Alert.alert("Thành công", "Đã thêm danh mục mới.");
        }
      }

      setModalVisible(false);
      await loadData(false, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể lưu danh mục.";
      if (Platform.OS === "web") {
        window.alert("Lỗi: " + msg);
      } else {
        Alert.alert("Lỗi", msg);
      }
    } finally {
      setSaving(false);
    }
  }

  // Yêu cầu xóa danh mục (Kiểm tra ràng buộc khóa ngoại client-side theo đề bài)
  function handleRequestDeleteCategory(category: Category) {
    const relatedCourses = courses.filter((c) => c.categoryId === category.id);

    if (relatedCourses.length > 0) {
      // BỊ CHẶN: Có khóa học liên kết
      setDeleteTargetCategory(category);
      setBlockedDeleteCount(relatedCourses.length);
      return;
    }

    // ĐƯỢC PHÉP: Mở modal xác nhận xóa
    setBlockedDeleteCount(null);
    setDeleteTargetCategory(category);
  }

  // Thực hiện xóa khi không có khóa học
  async function handleConfirmDeleteCategory() {
    if (!deleteTargetCategory) return;

    try {
      setDeleting(true);
      await deleteCategory(deleteTargetCategory.id);
      setDeleteTargetCategory(null);

      if (Platform.OS === "web") {
        window.alert("Đã xóa danh mục thành công.");
      } else {
        Alert.alert("Thành công", "Đã xóa danh mục thành công.");
      }

      await loadData(false, true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể xóa danh mục.";
      if (Platform.OS === "web") {
        window.alert("Lỗi: " + msg);
      } else {
        Alert.alert("Lỗi", msg);
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading && categories.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải danh sách danh mục...</Text>
      </View>
    );
  }

  if (error && categories.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          onPress={() => loadData(false)}
        >
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={["#2563eb"]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerTitles}>
                <Text style={styles.pageTitle}>Quản lý danh mục</Text>
                <Text style={styles.pageSubtitle}>
                  Tổng số: {categories.length} danh mục khóa học
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.addBtn,
                  pressed && styles.pressed,
                ]}
                onPress={openCreateModal}
              >
                <Text style={styles.addBtnText}>＋ Thêm mới</Text>
              </Pressable>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>💡 Lưu ý ràng buộc:</Text>
              <Text style={styles.noteText}>
                Không thể xóa danh mục đang có khóa học liên kết. MockAPI không
                hỗ trợ ràng buộc khóa ngoại nên ứng dụng sẽ tự động kiểm tra
                trước khi xóa.
              </Text>
            </View>

            {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Chưa có danh mục nào</Text>
            <Text style={styles.emptySubtitle}>
              Hãy nhấn nút &quot;Thêm mới&quot; ở trên để tạo danh mục khóa học
              đầu tiên.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const courseCount = courses.filter(
            (c) => c.categoryId === item.id
          ).length;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryTitleGroup}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <View
                    style={[
                      styles.countBadge,
                      courseCount > 0
                        ? styles.countBadgeActive
                        : styles.countBadgeZero,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        courseCount > 0
                          ? styles.countBadgeTextActive
                          : styles.countBadgeTextZero,
                      ]}
                    >
                      {courseCount} khóa học
                    </Text>
                  </View>
                </View>

                {/* Nút Sửa / Xóa */}
                <View style={styles.cardActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionIconButton,
                      styles.editActionBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => openEditModal(item)}
                  >
                    <Text style={styles.editActionText}>✏️ Sửa</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionIconButton,
                      styles.deleteActionBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleRequestDeleteCategory(item)}
                  >
                    <Text style={styles.deleteActionText}>🗑️ Xóa</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.categoryDesc}>
                {item.description || "Chưa có mô tả chi tiết cho danh mục này."}
              </Text>
            </View>
          );
        }}
      />

      {/* Modal Thêm / Sửa Danh mục */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.formLabel}>
                Tên danh mục <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ví dụ: Lập trình Mobile"
                placeholderTextColor="#94a3b8"
                value={categoryName}
                onChangeText={setCategoryName}
              />

              <Text style={styles.formLabel}>Mô tả danh mục</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Ví dụ: Android, Flutter, React Native"
                placeholderTextColor="#94a3b8"
                value={categoryDesc}
                onChangeText={setCategoryDesc}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalSaveBtn,
                    saving && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleSaveCategory}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>
                      {editingCategory ? "💾 Cập nhật" : "➕ Thêm danh mục"}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Xóa hoặc Cảnh báo Danh mục (Hoạt động đa nền tảng Web + Mobile) */}
      <Modal
        visible={Boolean(deleteTargetCategory)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setDeleteTargetCategory(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!deleting) setDeleteTargetCategory(null);
          }}
        >
          <View
            style={styles.alertModalBox}
            onStartShouldSetResponder={() => true}
          >
            {blockedDeleteCount !== null ? (
              // Trường hợp 1: Bị chặn vì đang có khóa học
              <>
                <View style={styles.warningIconCircle}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                </View>
                <Text style={styles.alertModalTitle}>
                  Không thể xóa danh mục!
                </Text>
                <Text style={styles.alertModalMessage}>
                  Danh mục{" "}
                  <Text style={styles.boldText}>
                    &quot;{deleteTargetCategory?.name}&quot;
                  </Text>{" "}
                  hiện đang có{" "}
                  <Text style={styles.dangerText}>
                    {blockedDeleteCount} khóa học
                  </Text>{" "}
                  liên kết.{"\n\n"}Theo yêu cầu đề bài, bạn không thể xóa danh
                  mục đang chứa khóa học. Vui lòng chuyển hoặc xóa các khóa học
                  thuộc danh mục này trước!
                </Text>
                <Pressable
                  style={styles.alertSingleBtn}
                  onPress={() => setDeleteTargetCategory(null)}
                >
                  <Text style={styles.alertSingleBtnText}>Đã hiểu</Text>
                </Pressable>
              </>
            ) : (
              // Trường hợp 2: Hợp lệ để xóa (0 khóa học)
              <>
                <View style={styles.deleteIconCircle}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </View>
                <Text style={styles.alertModalTitle}>Xác nhận xóa danh mục</Text>
                <Text style={styles.alertModalMessage}>
                  Bạn có chắc chắn muốn xóa danh mục{"\n"}
                  <Text style={styles.boldText}>
                    &quot;{deleteTargetCategory?.name}&quot;
                  </Text>
                  {"\n"}không? Thao tác này không thể khôi phục.
                </Text>
                <View style={styles.alertModalActions}>
                  <Pressable
                    style={styles.cancelAlertBtn}
                    onPress={() => setDeleteTargetCategory(null)}
                    disabled={deleting}
                  >
                    <Text style={styles.cancelAlertBtnText}>Hủy bỏ</Text>
                  </Pressable>
                  <Pressable
                    style={styles.confirmDeleteAlertBtn}
                    onPress={handleConfirmDeleteCategory}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.confirmDeleteAlertBtnText}>
                        Xóa ngay
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748b",
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitles: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 3,
  },
  addBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  noteBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 2,
  },
  noteText: {
    fontSize: 12,
    color: "#1e3a8a",
    lineHeight: 18,
  },
  inlineError: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 8,
  },
  categoryTitleGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeActive: {
    backgroundColor: "#dbeafe",
  },
  countBadgeZero: {
    backgroundColor: "#f1f5f9",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  countBadgeTextActive: {
    color: "#1d4ed8",
  },
  countBadgeTextZero: {
    color: "#64748b",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-end",
  },
  actionIconButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  editActionBtn: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  editActionText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
  deleteActionBtn: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  deleteActionText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },
  categoryDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalCloseText: {
    fontSize: 18,
    color: "#64748b",
    padding: 4,
  },
  modalForm: {
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  required: {
    color: "#dc2626",
  },
  modalInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  modalTextarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    marginTop: 8,
    gap: 8,
  },
  modalSaveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSaveBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCancelBtnText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },

  // Alert Modal (Xóa / Cảnh báo)
  alertModalBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  warningIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  warningIcon: {
    fontSize: 28,
  },
  deleteIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  deleteIcon: {
    fontSize: 28,
  },
  alertModalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },
  alertModalMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  boldText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  dangerText: {
    color: "#dc2626",
    fontWeight: "700",
  },
  alertSingleBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  alertSingleBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  alertModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelAlertBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelAlertBtnText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmDeleteAlertBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmDeleteAlertBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
