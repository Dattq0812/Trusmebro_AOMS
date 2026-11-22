import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import 'router.dart';

class AomsApp extends StatelessWidget {
  const AomsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AOMS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: appRouter,
    );
  }
}