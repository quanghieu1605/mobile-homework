import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type FormState = {
  userName: string;
  mssv: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function Screen1() {
  const [form, setForm] = useState<FormState>({ userName: '', mssv: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (errors[field] && value.trim()) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    const nextErrors: FormErrors = {};
    const userName = form.userName.trim();
    const mssv = form.mssv.trim();

    if (!userName) nextErrors.userName = 'Vui lòng nhập UserName';
    if (!mssv) {
      nextErrors.mssv = 'Vui lòng nhập MSSV';
    } else if (!/^B[A-Za-z]{2}(2[2-6])\d{4}$/.test(mssv)) {
      nextErrors.mssv = 'MSSV không đúng định dạng (VD: BIT240091)';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const errorLines: string[] = [];
      if (!userName) errorLines.push('• Họ tên (UserName): chưa nhập');
      if (!mssv) {
        errorLines.push('• MSSV: chưa nhập');
      } else if (nextErrors.mssv) {
        errorLines.push(
          '• MSSV không đúng định dạng\n' +
          '  - Ký tự 1: chữ B viết hoa\n' +
          '  - Ký tự 2-3: chữ cái A-Z (hoa hoặc thường)\n' +
          '  - Kí tự 4-5: năm nhập học (22 → 26)\n' +
          '  - Kí tự 6-9: 4 chữ số (0 → 9)\n' +
          '  Ví dụ hợp lệ: BIT240091'
        );
      }
      const isMssvFormatError = !!(nextErrors.mssv && mssv);
      setModalTitle(isMssvFormatError && !nextErrors.userName ? '⚠️ Sai định dạng MSSV' : '⚠️ Thiếu / Sai thông tin');
      setModalMessage(errorLines.join('\n\n'));
      setModalVisible(true);
      return;
    }


    router.push({
      pathname: '/screen2',
      params: { userName, mssv },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        {/* Number grid */}
        <View style={styles.numberGrid}>
          <View style={styles.tileRow}>
            <NumberTile color="#2F80ED" number="1" style={styles.flexOneWithMargin} />
            <NumberTile color="#F23847" number="2" style={styles.flexOne} />
          </View>

          <View style={styles.tileRow}>
            <View style={styles.leftPair}>
              <NumberTile
                color="#FFD512"
                number="3"
                style={styles.flexOneWithMargin}
                textColor="#111"
              />
              <NumberTile color="#2DB36C" number="4" style={styles.flexOne} />
            </View>
            <NumberTile color="#7D3FE0" number="5" style={styles.flexOne} />
          </View>

          <NumberTile color="#FF7412" number="6" style={styles.tileSix} />
        </View>

        {/* Form area */}
        <View style={styles.formArea}>
          <Text style={styles.formTitle}>Nhập thông tin sinh viên</Text>

          <TextInput
            autoCapitalize="words"
            onChangeText={(value) => updateField('userName', value)}
            placeholder="Enter your name"
            placeholderTextColor="#555"
            style={[styles.input, errors.userName && styles.inputError]}
            value={form.userName}
          />
          {errors.userName ? <Text style={styles.errorText}>{errors.userName}</Text> : null}

          <TextInput
            autoCapitalize="none"
            onChangeText={(value) => updateField('mssv', value)}
            placeholder="Enter your student ID"
            placeholderTextColor="#555"
            style={[styles.input, errors.mssv && styles.inputError]}
            value={form.mssv}
          />
          {errors.mssv ? <Text style={styles.errorText}>{errors.mssv}</Text> : null}
        </View>

        {/* "Click me" button */}
        <View style={styles.bottomButtonWrapper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Click me"
            onPress={handleSubmit}
            style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
          >
            <Text style={styles.submitText}>Click me</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Error dialog — works on both web and native */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NumberTile({
  color,
  number,
  style,
  textColor = '#FFF',
}: {
  color: string;
  number: string;
  style?: object;
  textColor?: string;
}) {
  return (
    <View style={[styles.numberTile, { backgroundColor: color }, style]}>
      <Text style={[styles.numberText, { color: textColor }]}>{number}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  numberGrid: {
    width: '100%',
  },
  tileRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  numberTile: {
    alignItems: 'center',
    height: 130,
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 40,
    fontWeight: '700',
  },
  flexOne: {
    flex: 1,
  },
  flexOneWithMargin: {
    flex: 1,
    marginRight: 8,
  },
  leftPair: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  tileSix: {
    height: 120,
    width: '100%',
  },
  formArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 2,
  },
  formTitle: {
    color: '#292929',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  input: {
    borderColor: '#CFCFCF',
    borderRadius: 5,
    borderWidth: 1,
    color: '#111',
    fontSize: 16,
    height: 48,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 11,
    marginBottom: 5,
  },
  bottomButtonWrapper: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  submitButton: {
    backgroundColor: '#ED8A20',
    borderRadius: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  submitText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  // Modal styles
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 10,
    marginHorizontal: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '80%',
  },
  modalTitle: {
    color: '#D32F2F',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#333',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'left',
  },
  modalButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ED8A20',
    borderRadius: 6,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

