import '../../core/api_client.dart';
import 'cash_models.dart';

class CashService {
  CashService(this._apiClient);

  final ApiClient _apiClient;

  Future<CashSummary> getSummary(String token) async {
    final data = await _apiClient.get('/api/cash/summary', token: token) as Map<String, dynamic>;
    return CashSummary.fromJson(data);
  }

  Future<List<CashMovementItem>> listMovements(String token) async {
    final data = await _apiClient.get('/api/cash/movements', token: token) as List<dynamic>;
    return data.map((e) => CashMovementItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CashMovementItem> createMovement(
    String token, {
    required CashMovementType type,
    required String category,
    required double amount,
    required DateTime movementDate,
    required String description,
  }) async {
    final data = await _apiClient.post(
      '/api/cash/movements',
      {
        'type': cashMovementTypeToApi(type),
        'category': category,
        'amount': amount,
        'movementDate': _dateOnly(movementDate),
        'description': description,
      },
      token: token,
    ) as Map<String, dynamic>;

    return CashMovementItem.fromJson(data);
  }

  Future<void> deleteMovement(String token, int id) async {
    await _apiClient.delete('/api/cash/movements/$id', token: token);
  }

  String _dateOnly(DateTime value) {
    final y = value.year.toString().padLeft(4, '0');
    final m = value.month.toString().padLeft(2, '0');
    final d = value.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }
}
