import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export interface Student {
  id: string;        // Unique identifier (UUID)
  studentId: string; // MSSV (e.g., BCN240001)
  fullName: string;  // Họ và tên
  email: string;     // Email
  avatar: string;    // URL hoặc local URI
  createdAt: number; // Timestamp
}

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    appName: 'Quản Lý Sinh Viên',
    tagline: 'Danh sách sinh viên',
    studentList: 'Danh Sách Sinh Viên',
    studentCount: '{count} sinh viên',
    noStudents: 'Chưa có sinh viên nào trong danh sách',
    noStudentsHint: 'Nhấn nút "Thêm Sinh Viên" bên dưới để tạo sinh viên mới',
    addStudent: 'Thêm Sinh Viên',
    editStudent: 'Sửa Thông Tin SV',
    studentDetail: 'Thông Tin Chi Tiết Sinh Viên',
    fullName: 'Họ và Tên',
    studentId: 'Mã Số Sinh Viên (MSSV)',
    email: 'Email',
    avatar: 'Ảnh Đại Diện',
    avatarUrl: 'Link Ảnh (URL)',
    pickFromGallery: 'Chọn ảnh từ thiết bị',
    orEnterUrl: 'Hoặc nhập đường dẫn (link) ảnh bên dưới',
    enterFullName: 'Nhập họ và tên sinh viên...',
    enterStudentId: 'Nhập mã số SV (VD: BCN240001)...',
    enterEmail: 'Nhập địa chỉ email (VD: sinhvien@gmail.com)...',
    enterAvatarUrl: 'https://example.com/avatar.jpg',
    save: 'Lưu Thông Tin',
    cancel: 'Hủy Bỏ',
    close: 'Đóng',
    edit: 'Sửa',
    delete: 'Xóa',
    yes: 'Có',
    no: 'Không',
    confirmDeleteTitle: 'Xác Nhận Xóa',
    confirmDeleteMsg: 'Bạn có muốn xóa thông tin SV không?',
    confirmEditTitle: 'Xác Nhận Sửa',
    confirmEditMsg: 'Bạn có muốn sửa thông tin SV không?',
    errNameRequired: 'Vui lòng nhập họ và tên',
    errIdRequired: 'Vui lòng nhập mã số sinh viên',
    errIdFormat: 'MSSV không đúng định dạng! Phải gồm 9 ký tự: bắt đầu bằng chữ "B" in hoa + 2 chữ cái (A-Z) + 2 số từ 22-26 + 4 số cuối (0-9). Ví dụ: BCN240001',
    errIdExists: 'Mã số sinh viên này đã tồn tại',
    errEmailRequired: 'Vui lòng nhập địa chỉ email',
    errEmailInvalid: 'Email không đúng định dạng (VD: example@email.com)',
    joinedDate: 'Ngày thêm',
    switchLang: 'EN',
  },
  en: {
    appName: 'Student Management',
    tagline: 'Student list',
    studentList: 'Student Directory',
    studentCount: '{count} students',
    noStudents: 'No students in the list yet',
    noStudentsHint: 'Tap "Add Student" button below to create one',
    addStudent: 'Add Student',
    editStudent: 'Edit Student Info',
    studentDetail: 'Student Details',
    fullName: 'Full Name',
    studentId: 'Student ID',
    email: 'Email Address',
    avatar: 'Avatar Picture',
    avatarUrl: 'Image Link (URL)',
    pickFromGallery: 'Upload from device',
    orEnterUrl: 'Or enter image link below',
    enterFullName: 'Enter student full name...',
    enterStudentId: 'Enter student ID (e.g. BCN240001)...',
    enterEmail: 'Enter student email (e.g. student@gmail.com)...',
    enterAvatarUrl: 'https://example.com/avatar.jpg',
    save: 'Save Info',
    cancel: 'Cancel',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    yes: 'Yes',
    no: 'No',
    confirmDeleteTitle: 'Confirm Delete',
    confirmDeleteMsg: 'Do you want to delete this student info?',
    confirmEditTitle: 'Confirm Edit',
    confirmEditMsg: 'Do you want to edit this student info?',
    errNameRequired: 'Please enter student full name',
    errIdRequired: 'Please enter student ID',
    errIdFormat: 'Invalid Student ID format! Must have 9 chars: starts with "B" + 2 letters (A-Z) + 2 digits (22-26) + 4 digits (0-9). E.g.: BCN240001',
    errIdExists: 'This student ID already exists',
    errEmailRequired: 'Please enter email address',
    errEmailInvalid: 'Invalid email address format (e.g. example@email.com)',
    joinedDate: 'Added Date',
    switchLang: 'VI',
  },
};

// MSSV Regex: B + 2 chữ cái in hoa (A-Z) + 2 số (22-26) + 4 số (0-9). Tổng cộng đúng 9 ký tự.
export const MSSV_REGEX = /^B[A-Z]{2}2[2-6][0-9]{4}$/;

// Email Regex chuẩn
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const STORAGE_KEY = '@students_v3';
const LANG_STORAGE_KEY = '@app_language_v3';

export async function getStoredLanguage(): Promise<Language> {
  try {
    const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {}
  try {
    const locales = getLocales();
    const code = locales?.[0]?.languageCode;
    return code === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
}

export async function setStoredLanguage(lang: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {}
}

/** Load students from local AsyncStorage */
export async function loadStudents(): Promise<Student[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Student[];
  } catch {
    return [];
  }
}

/** Save students list to local AsyncStorage */
export async function saveStudents(list: Student[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
