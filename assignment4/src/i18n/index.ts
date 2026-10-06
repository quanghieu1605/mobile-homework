import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  vi: {
    // App
    appName: 'Quản Lý Sinh Viên',
    // Screen titles
    studentList: 'Danh Sách Sinh Viên',
    studentDetail: 'Thông Tin Sinh Viên',
    addStudent: 'Thêm Sinh Viên',
    editStudent: 'Sửa Thông Tin SV',
    // Fields
    fullName: 'Họ và Tên',
    studentId: 'Mã Số SV',
    email: 'Email',
    avatar: 'Ảnh Đại Diện',
    avatarUrl: 'Link Ảnh (URL)',
    // Placeholders
    enterFullName: 'Nhập họ và tên...',
    enterStudentId: 'Nhập mã số SV (VD: SV001)...',
    enterEmail: 'Nhập email...',
    enterAvatarUrl: 'Nhập link ảnh (https://...)...',
    searchPlaceholder: 'Tìm kiếm theo tên, MSSV...',
    // Buttons
    save: 'Lưu',
    cancel: 'Hủy',
    edit: 'Sửa',
    delete: 'Xóa',
    add: 'Thêm SV',
    yes: 'Có',
    no: 'Không',
    pickImage: 'Chọn từ thư viện',
    // Confirm dialogs
    confirmDelete: 'Xác Nhận Xóa',
    confirmDeleteMsg: 'Bạn có muốn xóa thông tin sinh viên "{name}" không?',
    confirmEdit: 'Xác Nhận Sửa',
    confirmEditMsg: 'Bạn có muốn sửa thông tin sinh viên "{name}" không?',
    // Messages
    noStudents: 'Chưa có sinh viên nào.\nNhấn + để thêm mới!',
    requiredField: 'Trường này không được để trống',
    invalidEmail: 'Email không hợp lệ',
    duplicateId: 'Mã số SV đã tồn tại',
    saveSuccess: 'Lưu thành công!',
    deleteSuccess: 'Đã xóa sinh viên!',
    // Count
    totalStudents: '{count} sinh viên',
  },
  en: {
    // App
    appName: 'Student Management',
    // Screen titles
    studentList: 'Student List',
    studentDetail: 'Student Details',
    addStudent: 'Add Student',
    editStudent: 'Edit Student',
    // Fields
    fullName: 'Full Name',
    studentId: 'Student ID',
    email: 'Email',
    avatar: 'Avatar',
    avatarUrl: 'Image URL',
    // Placeholders
    enterFullName: 'Enter full name...',
    enterStudentId: 'Enter student ID (e.g. SV001)...',
    enterEmail: 'Enter email...',
    enterAvatarUrl: 'Enter image URL (https://...)...',
    searchPlaceholder: 'Search by name or ID...',
    // Buttons
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add Student',
    yes: 'Yes',
    no: 'No',
    pickImage: 'Pick from library',
    // Confirm dialogs
    confirmDelete: 'Confirm Delete',
    confirmDeleteMsg: 'Do you want to delete student "{name}"?',
    confirmEdit: 'Confirm Edit',
    confirmEditMsg: 'Do you want to edit student "{name}"?',
    // Messages
    noStudents: 'No students yet.\nTap + to add one!',
    requiredField: 'This field is required',
    invalidEmail: 'Invalid email address',
    duplicateId: 'Student ID already exists',
    saveSuccess: 'Saved successfully!',
    deleteSuccess: 'Student deleted!',
    // Count
    totalStudents: '{count} students',
  },
};

const i18n = new I18n(translations);
i18n.locale = getLocales()[0]?.languageCode ?? 'vi';
i18n.enableFallback = true;
i18n.defaultLocale = 'vi';

export default i18n;

