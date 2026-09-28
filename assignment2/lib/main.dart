import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  // Hàm tạo ô
  Widget _box(String number, Color color, {Color textColor = Colors.white}) {
    return Container(
      color: color,
      child: Center(
        child: Text(
          number,
          style: TextStyle(
            color: textColor,
            fontSize: 58,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.white,
        statusBarIconBrightness: Brightness.dark,
      ),
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  SizedBox(
                    height: 100,
                    width: double.infinity,
                    child: _box('1', const Color(0xFF1976F3)),
                  ),

                  const SizedBox(height: 9),

                  SizedBox(
                    height: 100,
                    width: double.infinity,
                    child: _box('2', const Color(0xFFF53636)),
                  ),

                  const SizedBox(height: 9),

                  SizedBox(
                    height: 200,
                    child: Row(
                      children: [
                        Expanded(
                          child: _box(
                            '3',
                            const Color(0xFFFFD719),
                            textColor: Colors.black,
                          ),
                        ),

                        const SizedBox(width: 9),

                        Expanded(
                          child: _box('4', const Color(0xFF28AE63)),
                        ),

                        const SizedBox(width: 9),

                        Expanded(
                          child: _box('5', const Color(0xFF8239DF)),
                        ),

                        const SizedBox(width: 9),

                        Expanded(
                          child: Container(color: Colors.white),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 9),

                  SizedBox(
                    height: 155,
                    width: double.infinity,
                    child: _box('6', const Color(0xFFFF7312)),
                  ),
                ],
              ),
            ),

            const Spacer(),

            const Padding(
              padding: EdgeInsets.only(bottom: 15),
              child: Text(
                'Nguyễn Quang Hiếu - BIT240091',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF444444),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

