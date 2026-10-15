import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";

import { deleteCourse, getCategories, getCourseById } from "../services/api";
import type { Category } from "../types/category";
import type { Course } from "../types/course";

// Component phát video trên thiết bị di động Native (Android/iOS)
function NativeVideoPlayer({ sourceUrl }: { sourceUrl: string }) {
  const player = useVideoPlayer(sourceUrl, (instance) => {
    instance.loop = false;
  });

  return (
    <View style={styles.videoSection}>
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls
          contentFit="contain"
        />
      </View>
      <View style={styles.videoActions}>
        <Pressable
          style={({ pressed }) => [styles.videoBtn, pressed && styles.pressed]}
          onPress={() => player.play()}
        >
          <Text style={styles.videoBtnText}>▶ Phát trailer</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.videoBtnSecondary,
            pressed && styles.pressed,
          ]}
          onPress={() => player.pause()}
        >
          <Text style={styles.videoBtnSecondaryText}>❚❚ Tạm dừng</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Component phát video trên trình duyệt Web (loại bỏ hoàn toàn lỗi NotSupportedError)
function WebVideoPlayer({ sourceUrl }: { sourceUrl: string }) {
  return (
    <View style={styles.videoSection}>
      <View style={styles.videoContainer}>
        {React.createElement("video", {
          src: sourceUrl,
          controls: true,
          style: {
            width: "100%",
            height: "220px",
            backgroundColor: "#0f172a",
            borderRadius: "12px",
            outline: "none",
          },
        })}
      </View>
    </View>
  );
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  // Load / reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadDetail() {
        if (!id) return;
        try {
          setLoading(true);
          setError("");
          setImageError(false);

          const [courseData, categoryData] = await Promise.all([
            getCourseById(id),
            getCategories(),
          ]);

          if (isMounted) {
            setCourse(courseData);
            setCategories(categoryData);
          }
        } catch (err) {
          if (isMounted) {
            setError(
              err instanceof Error
                ? err.message
                : "Không thể tải thông tin khóa học."
            );
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      loadDetail();

      return () => {
        isMounted = false;
      };
    }, [id])
  );

  const isYouTubeUrl =
    Boolean(
      course?.trailerUrl?.includes("youtube.com") ||
        course?.trailerUrl?.includes("youtu.be")
    );

  const validVideoSource =
    course?.trailerUrl && !isYouTubeUrl && course.trailerUrl.startsWith("http")
      ? course.trailerUrl
      : null;

  const categoryName =
    categories.find((category) => category.id === course?.categoryId)?.name ??
    "Chưa phân loại";

  function handleOpenYouTube() {
    if (course?.trailerUrl) {
      Linking.openURL(course.trailerUrl).catch(() => {
        if (Platform.OS === "web") {
          window.alert("Không thể mở liên kết video trailer.");
        } else {
          Alert.alert("Lỗi", "Không thể mở liên kết video trailer.");
        }
      });
    }
  }

  // Nút Xem trailer nổi bật
  function handleWatchTrailerPress() {
    if (validVideoSource) {
      scrollViewRef.current?.scrollTo({ y: 560, animated: true });
    } else if (isYouTubeUrl) {
      handleOpenYouTube();
    } else if (course?.trailerUrl) {
      Linking.openURL(course.trailerUrl).catch(() => {
        if (Platform.OS === "web") {
          window.alert("Không thể mở liên kết video: " + course.trailerUrl);
        } else {
          Alert.alert("Lỗi", "Không thể mở liên kết: " + course.trailerUrl);
        }
      });
    } else {
      if (Platform.OS === "web") {
        window.alert("Khóa học này hiện chưa có video trailer.");
      } else {
        Alert.alert("Thông báo", "Khóa học này hiện chưa có video trailer.");
      }
    }
  }

  // Mở modal xác nhận xóa khóa học
  function handleRequestDelete() {
    if (!course) return;
    setDeleteModalVisible(true);
  }

  // Thực hiện xóa khóa học sau khi xác nhận
  async function handleConfirmDelete() {
    if (!course) return;

    try {
      setDeleting(true);
      await deleteCourse(course.id);
      setDeleteModalVisible(false);

      if (Platform.OS === "web") {
        window.alert("Đã xóa khóa học thành công.");
      } else {
        Alert.alert("Thành công", "Đã xóa khóa học thành công.");
      }

      router.replace("/");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể xóa khóa học.";
      if (Platform.OS === "web") {
        window.alert("Lỗi: " + msg);
      } else {
        Alert.alert("Lỗi", msg);
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.message}>Đang tải thông tin khóa học...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Không tìm thấy khóa học."}</Text>
        <Pressable
          style={styles.backActionButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.backActionButtonText}>Quay lại danh sách</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Nút quay lại */}
        <Pressable
          style={({ pressed }) => [
            styles.backHeaderButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹ Quay lại</Text>
        </Pressable>

        {/* Ảnh bìa */}
        {course.thumbnail && !imageError ? (
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.thumbnail, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>📚</Text>
            <Text style={styles.placeholderText}>
              {course.thumbnail ? "Không thể tải ảnh bìa" : "Chưa có ảnh bìa"}
            </Text>
          </View>
        )}

        {/* Tiêu đề & Danh mục */}
        <View style={styles.headerInfo}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryName}</Text>
          </View>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.price}>
            {Number(course.price).toLocaleString("vi-VN")} đ
          </Text>
        </View>

        {/* Bảng chi tiết */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👨‍🏫 Giảng viên</Text>
            <Text style={styles.infoValue}>{course.instructor}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏱️ Thời lượng</Text>
            <Text style={styles.infoValue}>{course.duration} giờ</Text>
          </View>
          {course.createdAt ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📅 Ngày tạo</Text>
                <Text style={styles.infoValue}>{course.createdAt}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Nút Xem Trailer Nổi Bật theo Yêu Cầu Đề Bài */}
        <Pressable
          style={({ pressed }) => [
            styles.watchTrailerBtn,
            pressed && styles.pressed,
          ]}
          onPress={handleWatchTrailerPress}
        >
          <Text style={styles.watchTrailerBtnText}>
            🎬 Xem video trailer khóa học
          </Text>
        </Pressable>

        {/* Mô tả */}
        <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            {course.description || "Chưa có mô tả cho khóa học này."}
          </Text>
        </View>

        {/* Video Trailer */}
        <Text style={styles.sectionTitle}>Video giới thiệu (Trailer)</Text>
        {validVideoSource ? (
          Platform.OS === "web" ? (
            <WebVideoPlayer sourceUrl={validVideoSource} />
          ) : (
            <NativeVideoPlayer sourceUrl={validVideoSource} />
          )
        ) : isYouTubeUrl ? (
          <View style={styles.youtubeCard}>
            <Text style={styles.youtubeNote}>
              Video trailer có định dạng YouTube. Bạn có thể mở trực tiếp để xem:
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.youtubeButton,
                pressed && styles.pressed,
              ]}
              onPress={handleOpenYouTube}
            >
              <Text style={styles.youtubeButtonText}>▶ Mở trên YouTube</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyTrailerBox}>
            <Text style={styles.emptyTrailerText}>
              {course.trailerUrl
                ? `Trailer: ${course.trailerUrl}`
                : "Khóa học này hiện chưa có video giới thiệu."}
            </Text>
          </View>
        )}

        {/* Các nút thao tác Sửa / Xóa */}
        <View style={styles.actionGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/course-form",
                params: { id: course.id },
              })
            }
          >
            <Text style={styles.editButtonText}>✏️ Chỉnh sửa thông tin</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              deleting && styles.disabledButton,
              pressed && styles.pressed,
            ]}
            onPress={handleRequestDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ Xóa khóa học này</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Xác nhận Xóa Khóa học (hoạt động 100% trên cả Web & Mobile) */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setDeleteModalVisible(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!deleting) setDeleteModalVisible(false);
          }}
        >
          <View
            style={styles.deleteModalBox}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.deleteIconCircle}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </View>

            <Text style={styles.deleteModalTitle}>Xác nhận xóa khóa học</Text>
            <Text style={styles.deleteModalMessage}>
              Bạn có chắc chắn muốn xóa khóa học{"\n"}
              <Text style={styles.deleteModalCourseName}>
                &quot;{course?.title}&quot;
              </Text>
              {"\n"}không? Thao tác này sẽ xóa vĩnh viễn và không thể khôi phục.
            </Text>

            <View style={styles.deleteModalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelModalBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelModalBtnText}>Hủy bỏ</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmDeleteBtn,
                  deleting && styles.disabledButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Xóa ngay</Text>
                )}
              </Pressable>
            </View>
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
  content: {
    padding: 18,
    paddingTop: 48,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  backHeaderButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  thumbnail: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    marginBottom: 16,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  headerInfo: {
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    marginBottom: 8,
  },
  categoryText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 32,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#15803d",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
  watchTrailerBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  watchTrailerBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
    marginTop: 6,
  },
  descriptionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#334155",
  },
  videoSection: {
    marginBottom: 24,
  },
  videoContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  video: {
    width: "100%",
    height: 220,
  },
  videoActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  videoBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  videoBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  videoBtnSecondary: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  videoBtnSecondaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  youtubeCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  youtubeNote: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 10,
  },
  youtubeButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  youtubeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyTrailerBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  emptyTrailerText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  actionGroup: {
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#2563eb",
    alignItems: "center",
  },
  editButtonText: {
    color: "#1d4ed8",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#dc2626",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  backActionButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backActionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.75,
  },

  // Modal Xóa
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModalBox: {
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
  deleteModalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  deleteModalMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  deleteModalCourseName: {
    color: "#0f172a",
    fontWeight: "700",
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelModalBtnText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmDeleteBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
