import 'package:flutter/material.dart';

import 'core/api_client.dart';
import 'features/auth/auth_service.dart';
import 'features/auth/login_page.dart';
import 'features/events/event_service.dart';
import 'features/home/dashboard_page.dart';
import 'features/members/member_service.dart';
import 'features/monthly_fees/monthly_fee_service.dart';

class GestorMcApp extends StatefulWidget {
  const GestorMcApp({super.key});

  @override
  State<GestorMcApp> createState() => _GestorMcAppState();
}

class _GestorMcAppState extends State<GestorMcApp> {
  static const _defaultApiUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );

  late final ApiClient _apiClient;
  late final AuthService _authService;
  late final MemberService _memberService;
  late final MonthlyFeeService _monthlyFeeService;
  late final EventService _eventService;

  AuthSession? _session;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient(baseUrl: _defaultApiUrl);
    _authService = AuthService(_apiClient);
    _memberService = MemberService(_apiClient);
    _monthlyFeeService = MonthlyFeeService(_apiClient);
    _eventService = EventService(_apiClient);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestor MC',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F6F8B)),
        useMaterial3: true,
      ),
      home: _session == null
          ? LoginPage(
              authService: _authService,
              onSuccess: (session) {
                setState(() {
                  _session = session;
                });
              },
            )
          : DashboardPage(
              session: _session!,
              memberService: _memberService,
              monthlyFeeService: _monthlyFeeService,
              eventService: _eventService,
              onLogout: () {
                setState(() {
                  _session = null;
                });
              },
            ),
    );
  }
}
