import '../../core/api_client.dart';
import 'member_models.dart';

class MemberService {
  MemberService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<MemberSummary>> listMembers(String token, {String? query}) async {
    final params = <String, String>{};
    if (query != null && query.trim().isNotEmpty) {
      params['query'] = query.trim();
    }

    final data = await _apiClient.get('/api/members', token: token, query: params) as List<dynamic>;
    return data
        .map((item) => MemberSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<MemberDetail> getMemberDetail(String token, int memberId) async {
    final data = await _apiClient.get('/api/members/$memberId', token: token) as Map<String, dynamic>;
    return MemberDetail.fromJson(data);
  }

  Future<MemberSummary> createMember(String token, UpsertMemberPayload payload) async {
    final data = await _apiClient.post('/api/members', payload.toJson(), token: token) as Map<String, dynamic>;
    return MemberSummary.fromJson(data);
  }

  Future<MemberSummary> updateMember(String token, int memberId, UpsertMemberPayload payload) async {
    final data = await _apiClient.put('/api/members/$memberId', payload.toJson(), token: token) as Map<String, dynamic>;
    return MemberSummary.fromJson(data);
  }

  Future<void> deleteMember(String token, int memberId) async {
    await _apiClient.delete('/api/members/$memberId', token: token);
  }

  Future<Motorcycle> createMotorcycle(String token, int memberId, UpsertMotorcyclePayload payload) async {
    final data = await _apiClient.post('/api/members/$memberId/motorcycles', payload.toJson(), token: token)
        as Map<String, dynamic>;
    return Motorcycle.fromJson(data);
  }

  Future<Motorcycle> updateMotorcycle(String token, int motorcycleId, UpsertMotorcyclePayload payload) async {
    final data = await _apiClient.put('/api/motorcycles/$motorcycleId', payload.toJson(), token: token)
        as Map<String, dynamic>;
    return Motorcycle.fromJson(data);
  }

  Future<void> deleteMotorcycle(String token, int motorcycleId) async {
    await _apiClient.delete('/api/motorcycles/$motorcycleId', token: token);
  }
}
