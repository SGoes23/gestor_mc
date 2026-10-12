import '../../core/api_client.dart';
import 'monthly_fee_models.dart';

class MonthlyFeeService {
  MonthlyFeeService(this._apiClient);

  final ApiClient _apiClient;

  Future<GenerateMonthlyFeesResult> generateMonthlyFees(
    String token, {
    required String referenceMonth,
    required double amount,
    required DateTime dueDate,
  }) async {
    final data = await _apiClient.post('/api/monthly-fees/generate', {
      'referenceMonth': referenceMonth,
      'amount': amount,
      'dueDate': _dateOnly(dueDate),
    }, token: token) as Map<String, dynamic>;

    return GenerateMonthlyFeesResult.fromJson(data);
  }

  Future<List<MonthlyFeeItem>> listByMonth(String token, String referenceMonth) async {
    final data = await _apiClient.get(
      '/api/monthly-fees',
      token: token,
      query: {'referenceMonth': referenceMonth},
    ) as List<dynamic>;

    return data.map((e) => MonthlyFeeItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<MonthlyFeeItem>> listDefaulters(String token, String referenceMonth) async {
    final data = await _apiClient.get(
      '/api/monthly-fees/defaulters',
      token: token,
      query: {'referenceMonth': referenceMonth},
    ) as List<dynamic>;

    return data.map((e) => MonthlyFeeItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<MonthlyFeeItem>> listMemberHistory(String token, int memberId) async {
    final data = await _apiClient.get('/api/monthly-fees/history/member/$memberId', token: token)
        as List<dynamic>;
    return data.map((e) => MonthlyFeeItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<MonthlyFeeItem> updateStatus(
    String token,
    int monthlyFeeId,
    MonthlyFeeStatus status, {
    DateTime? paymentDate,
  }) async {
    final data = await _apiClient.patch(
      '/api/monthly-fees/$monthlyFeeId/status',
      {
        'status': monthlyFeeStatusToApi(status),
        'paymentDate': paymentDate == null ? null : _dateOnly(paymentDate),
      },
      token: token,
    ) as Map<String, dynamic>;

    return MonthlyFeeItem.fromJson(data);
  }

  String _dateOnly(DateTime value) {
    final y = value.year.toString().padLeft(4, '0');
    final m = value.month.toString().padLeft(2, '0');
    final d = value.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }
}
