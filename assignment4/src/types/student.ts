export interface Student {
  id: string;        // UUID - internal key
  studentId: string; // Mã số SV (e.g. SV001)
  fullName: string;  // Họ và tên
  email: string;     // Email
  avatar: string;    // URL hoặc local URI
  createdAt: number; // timestamp
}

