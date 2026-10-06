import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student } from '@/types/student';

const STORAGE_KEY = '@students_data';

/** Read all students from AsyncStorage */
export async function getAllStudents(): Promise<Student[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Student[];
  } catch {
    return [];
  }
}

/** Save the entire list back to AsyncStorage */
async function saveAll(students: Student[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

/** Add a new student */
export async function addStudent(student: Student): Promise<void> {
  const list = await getAllStudents();
  list.push(student);
  await saveAll(list);
}

/** Update an existing student by its internal id */
export async function updateStudent(updated: Student): Promise<void> {
  const list = await getAllStudents();
  const idx = list.findIndex((s) => s.id === updated.id);
  if (idx !== -1) {
    list[idx] = updated;
    await saveAll(list);
  }
}

/** Delete a student by its internal id */
export async function deleteStudent(id: string): Promise<void> {
  const list = await getAllStudents();
  const filtered = list.filter((s) => s.id !== id);
  await saveAll(filtered);
}

/** Check if a studentId (MSSV) already exists, optionally excluding one id */
export async function isStudentIdTaken(
  studentId: string,
  excludeId?: string,
): Promise<boolean> {
  const list = await getAllStudents();
  return list.some((s) => s.studentId === studentId && s.id !== excludeId);
}

