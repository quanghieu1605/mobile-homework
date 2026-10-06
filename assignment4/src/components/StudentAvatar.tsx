import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Student } from '@/types/student';

interface AvatarProps {
  student: Student;
  size?: number;
}

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ec4899',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentAvatar({ student, size = 48 }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const hasImage = !!student.avatar && !imgError;
  const color = getColor(student.fullName || student.studentId);
  const initials = getInitials(student.fullName || student.studentId || '?');
  const fontSize = size * 0.36;

  if (hasImage) {
    return (
      <Image
        source={{ uri: student.avatar }}
        style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    backgroundColor: '#ccc',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});

