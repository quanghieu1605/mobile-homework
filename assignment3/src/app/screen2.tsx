import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Screen2Params = {
  userName?: string | string[];
  mssv?: string | string[];
};

const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function Screen2() {
  const params = useLocalSearchParams<Screen2Params>();
  const userName = getParamValue(params.userName);
  const mssv = getParamValue(params.mssv);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Back button — top-left, black arr    ow */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại Screen 1"
          hitSlop={10}
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        {/* Student info — centered */}
        <View style={styles.content}>
          <Text style={styles.title}>Screen 2</Text>
          <Text style={styles.info}>Name: {userName}</Text>
          <Text style={styles.info}>Student ID: {mssv}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#C8781A',
    borderRadius: 4,
    height: 30,
    justifyContent: 'center',
    left: 4,
    position: 'absolute',
    top: 4,
    width: 60,
    zIndex: 1,
  },
  backLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#111',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  info: {
    color: '#555',
    fontSize: 14,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.5,
  },
});
