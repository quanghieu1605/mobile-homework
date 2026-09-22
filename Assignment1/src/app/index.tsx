import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <SafeAreaView style={styles.container}>

        {/* Các ô màu */}
        <View style={styles.content}>

          {/* Hàng 1 */}
          <View style={styles.row}>
            <View style={[styles.box, styles.box1]}>
              <Text style={styles.whiteText}>1</Text>
            </View>

            <View style={[styles.box, styles.box2]}>
              <Text style={styles.whiteText}>2</Text>
            </View>
          </View>

          {/* Hàng 2 */}
          <View style={styles.row}>
            <View style={[styles.box, styles.box3]}>
              <Text style={styles.blackText}>3</Text>
            </View>

            <View style={[styles.box, styles.box4]}>
              <Text style={styles.whiteText}>4</Text>
            </View>

            <View style={[styles.box, styles.box5]}>
              <Text style={styles.whiteText}>5</Text>
            </View>
          </View>

          {/* Hàng 3 */}
          <View style={styles.row}>
            <View style={[styles.box, styles.box6]}>
              <Text style={styles.whiteText}>6</Text>
            </View>
          </View>

        </View>

        {/* Họ tên - MSSV */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentText}>
            Nguyễn Quang Hiếu - BIT240091
          </Text>
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  // Toàn bộ màn hình
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Khu vực chứa 6 ô
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  // Mỗi hàng
  row: {
    flexDirection: 'row',
    width: '100%',
    height: 155,
    gap: 9,
    marginBottom: 9,
  },

  // Style chung cho các ô
  box: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ô số 1
  box1: {
    flex: 1,
    backgroundColor: '#1976F3',
  },

  // Ô số 2
  box2: {
    flex: 1,
    backgroundColor: '#F53636',
  },

  // Ô số 3
  box3: {
    flex: 0.5,
    backgroundColor: '#FFD719',
  },

  // Ô số 4
  box4: {
    flex: 0.5,
    backgroundColor: '#28AE63',
  },

  // Ô số 5
  box5: {
    flex: 1,
    backgroundColor: '#8239DF',
  },

  // Ô số 6
  box6: {
    flex: 1,
    backgroundColor: '#FF7312',
  },

  // Chữ màu trắng
  whiteText: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: 'bold',
  },

  // Chữ màu đen
  blackText: {
    color: '#000000',
    fontSize: 58,
    fontWeight: 'bold',
  },

  // Vị trí Họ tên - MSSV
  studentInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
  },

  // Chữ Họ tên - MSSV
  studentText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#444444',
  },
});

export default App;