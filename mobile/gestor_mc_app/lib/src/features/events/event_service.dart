import '../../core/api_client.dart';
import 'event_models.dart';

class EventService {
  EventService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<ClubEvent>> listEvents(String token) async {
    final data = await _apiClient.get('/api/events', token: token) as List<dynamic>;
    return data.map((item) => ClubEvent.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<ClubEvent> createEvent(String token, UpsertEventPayload payload) async {
    final data = await _apiClient.post('/api/events', payload.toJson(), token: token) as Map<String, dynamic>;
    return ClubEvent.fromJson(data);
  }

  Future<ClubEvent> updateEvent(String token, int eventId, UpsertEventPayload payload) async {
    final data = await _apiClient.put('/api/events/$eventId', payload.toJson(), token: token) as Map<String, dynamic>;
    return ClubEvent.fromJson(data);
  }

  Future<void> deleteEvent(String token, int eventId) {
    return _apiClient.delete('/api/events/$eventId', token: token);
  }
}
