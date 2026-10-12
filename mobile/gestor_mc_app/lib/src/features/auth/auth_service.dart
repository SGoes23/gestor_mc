import '../../core/api_client.dart';

class AuthSession {
  final String token;
  final String email;
  final String profile;

  const AuthSession({
    required this.token,
    required this.email,
    required this.profile,
  });

  bool get isDiretoria => profile.toUpperCase() == 'DIRETORIA';
}

class AuthService {
  AuthService(this._apiClient);

  final ApiClient _apiClient;

  Future<AuthSession> login(String email, String password) async {
    final data = await _apiClient.post('/api/auth/login', {
      'email': email,
      'password': password,
    }) as Map<String, dynamic>;

    return AuthSession(
      token: data['token'] as String,
      email: data['email'] as String,
      profile: data['profile'] as String,
    );
  }
}
