import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import 'event_models.dart';
import 'event_service.dart';

class EventsPage extends StatefulWidget {
  const EventsPage({
    super.key,
    required this.session,
    required this.eventService,
  });

  final AuthSession session;
  final EventService eventService;

  @override
  State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> {
  List<ClubEvent> _events = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final events = await widget.eventService.listEvents(widget.session.token);
      if (!mounted) return;
      setState(() => _events = events);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao carregar calendario: $error')));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _openForm({ClubEvent? event}) async {
    final payload = await showDialog<UpsertEventPayload>(
      context: context,
      builder: (_) => _EventDialog(initial: event),
    );
    if (payload == null) return;

    try {
      if (event == null) {
        await widget.eventService.createEvent(widget.session.token, payload);
      } else {
        await widget.eventService.updateEvent(widget.session.token, event.id, payload);
      }
      await _load();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao salvar evento: $error')));
    }
  }

  Future<void> _delete(ClubEvent event) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Excluir evento'),
            content: Text('Deseja excluir "${event.title}"?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
              FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Excluir')),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;

    try {
      await widget.eventService.deleteEvent(widget.session.token, event.id);
      await _load();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao excluir evento: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calendario de eventos')),
      floatingActionButton: widget.session.isDiretoria
          ? FloatingActionButton.extended(
              onPressed: _openForm,
              icon: const Icon(Icons.add),
              label: const Text('Novo evento'),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _events.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 180),
                        Center(child: Text('Nenhum evento cadastrado')),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _events.length,
                      itemBuilder: (context, index) {
                        final event = _events[index];
                        return Card(
                          child: ListTile(
                            leading: Icon(_iconFor(event.type)),
                            title: Text(event.title),
                            subtitle: Text(
                              '${_date(event.eventDate)} | ${clubEventTypeLabel(event.type)}\n${event.place}\n${event.description}',
                            ),
                            isThreeLine: true,
                            trailing: widget.session.isDiretoria
                                ? PopupMenuButton<String>(
                                    onSelected: (action) {
                                      if (action == 'edit') _openForm(event: event);
                                      if (action == 'delete') _delete(event);
                                    },
                                    itemBuilder: (context) => const [
                                      PopupMenuItem(value: 'edit', child: Text('Editar')),
                                      PopupMenuItem(value: 'delete', child: Text('Excluir')),
                                    ],
                                  )
                                : null,
                          ),
                        );
                      },
                    ),
            ),
    );
  }

  IconData _iconFor(ClubEventType type) {
    switch (type) {
      case ClubEventType.passeio:
        return Icons.two_wheeler;
      case ClubEventType.evento:
        return Icons.celebration;
      case ClubEventType.reuniao:
        return Icons.groups;
    }
  }

  String _date(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}

class _EventDialog extends StatefulWidget {
  const _EventDialog({this.initial});

  final ClubEvent? initial;

  @override
  State<_EventDialog> createState() => _EventDialogState();
}

class _EventDialogState extends State<_EventDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _dateController;
  late final TextEditingController _placeController;
  late final TextEditingController _descriptionController;
  late ClubEventType _type;

  @override
  void initState() {
    super.initState();
    final event = widget.initial;
    _titleController = TextEditingController(text: event?.title ?? '');
    _dateController = TextEditingController(text: event == null ? '' : _date(event.eventDate));
    _placeController = TextEditingController(text: event?.place ?? '');
    _descriptionController = TextEditingController(text: event?.description ?? '');
    _type = event?.type ?? ClubEventType.passeio;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _dateController.dispose();
    _placeController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.initial != null;
    return AlertDialog(
      title: Text(editing ? 'Editar evento' : 'Novo evento'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(controller: _titleController, decoration: const InputDecoration(labelText: 'Titulo'), validator: _required),
              DropdownButtonFormField<ClubEventType>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Tipo'),
                items: ClubEventType.values
                    .map((type) => DropdownMenuItem(value: type, child: Text(clubEventTypeLabel(type))))
                    .toList(),
                onChanged: (type) => setState(() => _type = type!),
              ),
              TextFormField(
                controller: _dateController,
                decoration: const InputDecoration(labelText: 'Data (AAAA-MM-DD)'),
                validator: (value) => _parseDate(value ?? '') == null ? 'Informe uma data valida' : null,
              ),
              TextFormField(controller: _placeController, decoration: const InputDecoration(labelText: 'Local'), validator: _required),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Descricao'),
                maxLines: 3,
                validator: _required,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () {
            if (!_formKey.currentState!.validate()) return;
            Navigator.pop(
              context,
              UpsertEventPayload(
                title: _titleController.text.trim(),
                type: _type,
                eventDate: _parseDate(_dateController.text)!,
                place: _placeController.text.trim(),
                description: _descriptionController.text.trim(),
              ),
            );
          },
          child: Text(editing ? 'Salvar' : 'Cadastrar'),
        ),
      ],
    );
  }

  String? _required(String? value) => (value ?? '').trim().isEmpty ? 'Campo obrigatorio' : null;

  DateTime? _parseDate(String value) {
    final date = DateTime.tryParse(value.trim());
    return date != null && value.trim().length == 10 ? date : null;
  }

  String _date(DateTime date) {
    return date.toIso8601String().substring(0, 10);
  }
}
