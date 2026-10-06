import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Student } from '@/types/student';
import {
  addStudent,
  deleteStudent,
  getAllStudents,
  updateStudent,
} from '@/services/studentStorage';

interface StudentContextValue {
  students: Student[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (s: Student) => Promise<void>;
  update: (s: Student) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllStudents();
    // Sort newest first
    setStudents(data.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (s: Student) => {
      await addStudent(s);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (s: Student) => {
      await updateStudent(s);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteStudent(id);
      await refresh();
    },
    [refresh],
  );

  return (
    <StudentContext.Provider value={{ students, loading, refresh, add, update, remove }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudents must be used inside StudentProvider');
  return ctx;
}

