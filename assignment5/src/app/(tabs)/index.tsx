import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCategories, getCourses } from "../../services/api";
import type { Category } from "../../types/category";
import type { Course } from "../../types/course";

// Component hiển thị thẻ khóa học với xử lý ảnh bìa và fallback an toàn
function CourseCardItem({
  item,
  categoryName,
  onPress,
}: {
  item: Course;
  categoryName: string;
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  const formattedPrice = (Number(item.price) || 0).toLocaleString("vi-VN") + " đ";

  return (
    <Pressable
      style={({ pressed }) => [styles.courseCard, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {item.thumbnail && !imgError ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.thumbnail, styles.imagePlaceholder]}>
          <Text style={styles.placeholderIcon}>📖</Text>
          <Text style={styles.placeholderText}>
            {item.thumbnail ? "Ảnh lỗi" : "Chưa có ảnh"}
          </Text>
        </View>
      )}

      <View style={styles.courseInfo}>
        <View style={styles.categoryBadgeMini}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.instructor} numberOfLines={1}>
          👨‍🏫 {item.instructor}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>{formattedPrice}</Text>
          {item.duration ? (
            <Text style={styles.duration}>⏱️ {item.duration}h</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(isRefresh = false, isSilent = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }

      setError("");

      const [courseData, categoryData] = await Promise.all([
        getCourses(),
        getCategories(),
      ]);

      setCourses(courseData);
      setCategories(categoryData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Tự động tải lại dữ liệu khi người dùng chuyển lại màn hình này (sau khi thêm/sửa/xóa)
  useFocusEffect(
    useCallback(() => {
      // Khi đã có dữ liệu rồi thì refresh ngầm (silent) để không giật màn hình
      const isInitial = courses.length === 0;
      loadData(false, !isInitial);
    }, [])
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || course.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, selectedCategory]);

  function getCategoryName(categoryId: string) {
    return (
      categories.find((category) => category.id === categoryId)?.name ??
      "Chưa phân loại"
    );
  }

  if (loading && courses.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingMessage}>Đang tải danh sách khóa học...</Text>
      </View>
    );
  }

  if (error && courses.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          onPress={() => loadData(false)}
        >
          <Text style={styles.retryText}>Thử lại ngay</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredCourses}
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
          <View style={styles.headerContainer}>
            {/* Thanh tiêu đề & nút thêm */}
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.heading}>Quản lý khóa học</Text>
                <Text style={styles.subtitle}>
                  Tổng cộng: {courses.length} khóa học
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push("/course-form")}
              >
                <Text style={styles.addButtonText}>＋ Thêm khóa học</Text>
              </Pressable>
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm theo tên khóa học..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
                  <Text style={styles.clearText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Thanh chọn danh mục */}
            <View style={styles.categoryHeaderRow}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              {selectedCategory !== "all" && (
                <Pressable onPress={() => setSelectedCategory("all")}>
                  <Text style={styles.resetFilterText}>Xem tất cả</Text>
                </Pressable>
              )}
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: "all", name: "Tất cả" }, ...categories]}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => {
                const active = selectedCategory === item.id;
                // Đếm số khóa học trong từng danh mục
                const count =
                  item.id === "all"
                    ? courses.length
                    : courses.filter((c) => c.categoryId === item.id).length;

                return (
                  <Pressable
                    style={[
                      styles.categoryButton,
                      active && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(item.id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        active && styles.categoryTextActive,
                      ]}
                    >
                      {item.name} ({count})
                    </Text>
                  </Pressable>
                );
              }}
            />

            {/* Tiêu đề danh sách kết quả */}
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>
                Khóa học ({filteredCourses.length})
              </Text>
            </View>

            {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy khóa học</Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? `Không có khóa học nào khớp với từ khóa "${search}".`
                : "Danh mục này hiện chưa có khóa học nào."}
            </Text>
            {(search || selectedCategory !== "all") && (
              <Pressable
                style={styles.resetButton}
                onPress={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
              >
                <Text style={styles.resetButtonText}>Đặt lại bộ lọc</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CourseCardItem
            item={item}
            categoryName={getCategoryName(item.categoryId)}
            onPress={() =>
              router.push({
                pathname: "/course-detail",
                params: { id: item.id },
              })
            }
          />
        )}
      />
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
  loadingMessage: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748b",
  },
  headerContainer: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748b",
  },
  addButton: {
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
  addButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: "#0f172a",
  },
  clearBtn: {
    padding: 6,
  },
  clearText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "bold",
  },
  categoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resetFilterText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  categoryList: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  categoryButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  categoryText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  resultHeader: {
    marginBottom: 12,
  },
  courseCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  thumbnail: {
    width: 105,
    height: 105,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  placeholderText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "500",
  },
  courseInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  categoryBadgeMini: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "700",
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 20,
  },
  instructor: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#15803d",
  },
  duration: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: "600",
  },
  inlineError: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 10,
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
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
