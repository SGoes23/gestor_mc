enum ClubEventType { passeio, evento, reuniao }

ClubEventType clubEventTypeFromApi(String value) {
  switch (value) {
    case 'REUNIAO':
      return ClubEventType.reuniao;
    case 'EVENTO':
      return ClubEventType.evento;
    default:
      return ClubEventType.passeio;
  }
}

String clubEventTypeToApi(ClubEventType value) {
  switch (value) {
    case ClubEventType.passeio:
      return 'ROLE';
    case ClubEventType.evento:
      return 'EVENTO';
    case ClubEventType.reuniao:
      return 'REUNIAO';
  }
}

String clubEventTypeLabel(ClubEventType value) {
  switch (value) {
    case ClubEventType.passeio:
      return 'Passeio';
    case ClubEventType.evento:
      return 'Evento';
    case ClubEventType.reuniao:
      return 'Reuniao';
  }
}

class ClubEvent {
  const ClubEvent({
    required this.id,
    required this.title,
    required this.type,
    required this.eventDate,
    required this.place,
    required this.description,
  });

  final int id;
  final String title;
  final ClubEventType type;
  final DateTime eventDate;
  final String place;
  final String description;

  factory ClubEvent.fromJson(Map<String, dynamic> json) {
    return ClubEvent(
      id: json['id'] as int,
      title: json['title'] as String,
      type: clubEventTypeFromApi(json['type'] as String),
      eventDate: DateTime.parse(json['eventDate'] as String),
      place: json['place'] as String,
      description: json['description'] as String,
    );
  }
}

class UpsertEventPayload {
  const UpsertEventPayload({
    required this.title,
    required this.type,
    required this.eventDate,
    required this.place,
    required this.description,
  });

  final String title;
  final ClubEventType type;
  final DateTime eventDate;
  final String place;
  final String description;

  Map<String, dynamic> toJson() {
    final date = eventDate.toIso8601String().substring(0, 10);
    return {
      'title': title,
      'type': clubEventTypeToApi(type),
      'eventDate': date,
      'place': place,
      'description': description,
    };
  }
}
