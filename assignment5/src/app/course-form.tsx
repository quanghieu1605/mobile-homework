import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createCourse,
  getCategories,
  getCourseById,
  updateCourse,
} from "../services/api";
import type { Category } from "../types/category";

export default function CourseFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [instructor, setInstructor] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  function notify(title: string, message: string, onOk?: () => void) {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(
        title,
        message,
        onOk ? [{ text: "OK", onPress: onOk }] : undefined
      );
    }
  }

  useEffect(() => {
    async function loadFormData() {
      try {
        setLoadingData(true);

        const categoryData = await getCategories();
        setCategories(categoryData);

        if (id) {
          const course = await getCourseById(id);
          setTitle(course.title);
          setDescription(course.description);
          setCategoryId(course.categoryId);
          setInstructor(course.instructor);
          setPrice(String(course.price));
          setDuration(String(course.duration));
          setThumbnail(course.thumbnail ?? "");
          setTrailerUrl(course.trailerUrl ?? "");
          setCreatedAt(course.createdAt ?? "");
        } else if (categoryData.length > 0) {
          setCategoryId(categoryData[0].id);
        }
      } catch (error) {
        notify(
          "Lỗi",
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu biểu mẫu."
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadFormData();
  }, [id]);

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  async function handleSave() {
    // Validation
    if (!title.trim()) {
      notify("Thiếu thông tin", "Vui lòng nhập tên khóa học.");
      return;
    }
    if (!description.trim()) {
      notify("Thiếu thông tin", "Vui lòng nhập mô tả khóa học.");
      return;
    }
    if (!categoryId) {
      notify("Thiếu thông tin", "Vui lòng chọn danh mục cho khóa học.");
      return;
    }
    if (!instructor.trim()) {
      notify("Thiếu thông tin", "Vui lòng nhập tên giảng viên.");
      return;
    }
    if (!price.trim()) {
      notify("Thiếu thông tin", "Vui lòng nhập học phí khóa học.");
      return;
    }
    if (!duration.trim()) {
      notify("Thiếu thông tin", "Vui lòng nhập thời lượng khóa học.");
      return;
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      notify(
        "Dữ liệu không hợp lệ",
        "Học phí phải là số không âm (≥ 0 VNĐ)."
      );
      return;
    }

    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      notify(
        "Dữ liệu không hợp lệ",
        "Thời lượng khóa học phải là số lớn hơn 0 (giờ)."
      );
      return;
    }

    // Kiểm tra categoryId phải tồn tại trong danh mục MockAPI
    const validCategory = categories.some((c) => c.id === categoryId);
    if (!validCategory) {
      notify(
        "Danh mục không hợp lệ",
        "Danh mục đã chọn không tồn tại trong hệ thống. Vui lòng chọn lại."
      );
      return;
    }

    try {
      setSaving(true);

      const coursePayload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        instructor: instructor.trim(),
        price: parsedPrice,
        duration: parsedDuration,
        thumbnail: thumbnail.trim(),
        trailerUrl: trailerUrl.trim(),
        createdAt: createdAt || new Date().toISOString().slice(0, 10),
      };

      if (isEditing && id) {
        await updateCourse(id, coursePayload);
        notify("Thành công", "Đã cập nhật thông tin khóa học.", () => {
          router.back();
        });
      } else {
        await createCourse(coursePayload);
        notify("Thành công", "Đã thêm khóa học mới thành công.", () => {
          router.replace("/");
        });
      }
    } catch (error) {
      notify(
        "Không thể lưu",
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi lưu khóa học."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải dữ liệu biểu mẫu...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nút quay lại */}
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>‹ Quay lại</Text>
        </Pressable>

        {/* Tiêu đề trang */}
        <Text style={styles.headerTitle}>
          {isEditing ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isEditing
            ? "Cập nhật các thông tin của khóa học vào hệ thống."
            : "Điền đầy đủ các thông tin bên dưới để tạo khóa học mới."}
        </Text>

        {/* 1. Tên khóa học */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Tên khóa học <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ví dụ: Lập trình React Native thực chiến"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* 2. Danh mục - Dropdown Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Danh mục khóa học <Text style={styles.required}>*</Text>
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.dropdownButton,
              pressed && styles.pressed,
            ]}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                !selectedCategoryObj && styles.dropdownPlaceholder,
              ]}
            >
              {selectedCategoryObj
                ? selectedCategoryObj.name
                : "-- Chọn danh mục --"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </Pressable>
        </View>

        {/* 3. Giảng viên */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Tên giảng viên <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={instructor}
            onChangeText={setInstructor}
            placeholder="Ví dụ: Nguyễn Văn A"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* 4. Học phí & Thời lượng */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Học phí (VNĐ) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="500000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Thời lượng (giờ) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* 5. Mô tả khóa học */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Mô tả chi tiết <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Nội dung, mục tiêu và kiến thức đạt được sau khóa học..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 6. URL Ảnh bìa (Thumbnail) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>URL Ảnh bìa (Thumbnail)</Text>
          <TextInput
            style={styles.input}
            value={thumbnail}
            onChangeText={(txt) => {
              setThumbnail(txt);
              setImagePreviewError(false);
            }}
            placeholder="https://images.unsplash.com/photo-..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="url"
          />
          {thumbnail.trim().length > 0 && (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Ảnh xem trước:</Text>
              {!imagePreviewError ? (
                <Image
                  source={{ uri: thumbnail.trim() }}
                  style={styles.previewImage}
                  resizeMode="cover"
                  onError={() => setImagePreviewError(true)}
                />
              ) : (
                <View style={styles.previewErrorBox}>
                  <Text style={styles.previewErrorText}>
                    ⚠️ Không thể tải trước ảnh từ URL này.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 7. URL Trailer */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>URL Video Trailer</Text>
          <TextInput
            style={styles.input}
            value={trailerUrl}
            onChangeText={setTrailerUrl}
            placeholder="https://.../video.mp4 hoặc link YouTube"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Hỗ trợ URL file MP4 trực tiếp hoặc liên kết video YouTube.
          </Text>
        </View>

        {/* Nút Lưu & Hủy */}
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              saving && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditing ? "💾 Lưu thay đổi" : "➕ Tạo khóa học"}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Dropdown chọn Danh mục */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục khóa học</Text>
              <Pressable onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.categoryScroll}>
              {categories.map((cat) => {
                const isSelected = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    style={({ pressed }) => [
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      setCategoryId(cat.id);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.categoryOptionTitle,
                          isSelected && styles.categoryOptionTitleSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                      {cat.description ? (
                        <Text style={styles.categoryOptionDesc}>
                          {cat.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
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
  scrollContent: {
    padding: 18,
    paddingBottom: 48,
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
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  backBtnText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  required: {
    color: "#dc2626",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  dropdownPlaceholder: {
    color: "#94a3b8",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#64748b",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },
  previewBox: {
    marginTop: 10,
  },
  previewTitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  previewErrorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  previewErrorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  actionButtons: {
    marginTop: 12,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "500",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
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
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalCloseText: {
    fontSize: 18,
    color: "#64748b",
    padding: 4,
  },
  categoryScroll: {
    maxHeight: 350,
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
  },
  categoryOptionSelected: {
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  categoryOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  categoryOptionTitleSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  categoryOptionDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
