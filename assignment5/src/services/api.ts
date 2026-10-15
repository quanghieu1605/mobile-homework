
import type { Category } from "../types/category";
import type { Course } from "../types/course";

const API_URL = "https://6ace005bf338359cf1c2d88e.mockapi.io/api/v1";

// ==================== CATEGORY API ====================

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/categories`);

  if (!response.ok) {
    throw new Error("Không thể tải danh sách danh mục.");
  }

  return response.json();
}

export async function createCategory(
  data: Omit<Category, "id">
): Promise<Category> {
  const response = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Không thể thêm danh mục.");
  }

  return response.json();
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id">>
): Promise<Category> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật danh mục.");
  }

  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Không thể xóa danh mục.");
  }
}

// ==================== COURSE API ====================

export async function getCourses(): Promise<Course[]> {
  const response = await fetch(`${API_URL}/courses`);

  if (!response.ok) {
    throw new Error("Không thể tải danh sách khóa học.");
  }

  return response.json();
}

export async function getCourseById(id: string): Promise<Course> {
  const response = await fetch(`${API_URL}/courses/${id}`);

  if (!response.ok) {
    throw new Error("Không tìm thấy khóa học.");
  }

  return response.json();
}

export async function createCourse(
  data: Omit<Course, "id">
): Promise<Course> {
  const response = await fetch(`${API_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Không thể thêm khóa học.");
  }

  return response.json();
}

export async function updateCourse(
  id: string,
  data: Omit<Course, "id">
): Promise<Course> {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật khóa học.");
  }

  return response.json();
}

export async function deleteCourse(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Không thể xóa khóa học.");
  }
}
