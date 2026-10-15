import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import '../monthly_fees/member_fee_history_page.dart';
import '../monthly_fees/monthly_fee_service.dart';
import 'member_models.dart';
import 'member_service.dart';

class MemberDetailPage extends StatefulWidget {
  const MemberDetailPage({
    super.key,
    required this.memberId,
    required this.session,
    required this.memberService,
    required this.monthlyFeeService,
  });

  final int memberId;
  final AuthSession session;
  final MemberService memberService;
  final MonthlyFeeService monthlyFeeService;

  @override
  State<MemberDetailPage> createState() => _MemberDetailPageState();
}

class _MemberDetailPageState extends State<MemberDetailPage> {
  MemberDetail? _member;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final member = await widget.memberService.getMemberDetail(widget.session.token, widget.memberId);
      if (!mounted) return;
      setState(() {
        _member = member;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Falha ao carregar detalhes: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _openMotorcycleForm({Motorcycle? motorcycle}) async {
    final current = _member;
    if (current == null) return;

    final payload = await showDialog<UpsertMotorcyclePayload>(
      context: context,
      builder: (_) => _MotorcycleDialog(
        initial: motorcycle,
        memberId: current.id,
      ),
    );

    if (payload == null) {
      return;
    }

    try {
      if (motorcycle == null) {
        await widget.memberService.createMotorcycle(widget.session.token, current.id, payload);
      } else {
        await widget.memberService.updateMotorcycle(widget.session.token, motorcycle.id, payload);
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao salvar moto: $e')),
      );
    }
  }

  Future<void> _deleteMotorcycle(Motorcycle motorcycle) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Excluir moto'),
            content: Text('Deseja excluir ${motorcycle.model} (${motorcycle.licensePlate})?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Excluir'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirmed) return;

    try {
      await widget.memberService.deleteMotorcycle(widget.session.token, motorcycle.id);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao excluir moto: $e')),
      );
    }
  }

  Future<void> _openFeeHistory(MemberDetail member) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MemberFeeHistoryPage(
          memberId: member.id,
          memberName: member.fullName,
          session: widget.session,
          monthlyFeeService: widget.monthlyFeeService,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final member = _member;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhes do membro'),
      ),
      floatingActionButton: widget.session.isDiretoria && member != null
          ? FloatingActionButton.extended(
              onPressed: () => _openMotorcycleForm(),
              label: const Text('Nova moto'),
              icon: const Icon(Icons.add),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : member == null
              ? const Center(child: Text('Membro nao encontrado'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(member.fullName, style: Theme.of(context).textTheme.titleLarge),
                              const SizedBox(height: 8),
                              Text('Apelido: ${member.nickname}'),
                              Text('Telefone: ${member.phone}'),
                              Text('Sanguineo: ${_bloodTypeLabel(member.bloodType)}'),
                              Text('Emergencia: ${member.emergencyContact}'),
                              Text('Endereco: ${member.address}'),
                              Text('Cargo: ${member.role}'),
                              Text('Status: ${member.status == MemberStatus.ativo ? 'Ativo' : 'Inativo'}'),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                onPressed: () => _openFeeHistory(member),
                                icon: const Icon(Icons.payments),
                                label: const Text('Historico de mensalidades'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Motos', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      if (member.motorcycles.isEmpty)
                        const Card(
                          child: ListTile(
                            title: Text('Nenhuma moto cadastrada'),
                          ),
                        )
                      else
                        ...member.motorcycles.map(
                          (moto) => Card(
                            child: ListTile(
                              title: Text('${moto.model} - ${moto.year}'),
                              subtitle: Text('Cor: ${moto.color} | Placa: ${moto.licensePlate}'),
                                trailing: widget.session.isDiretoria
                                  ? PopupMenuButton<String>(
                                      onSelected: (value) {
                                        if (value == 'edit') {
                                          _openMotorcycleForm(motorcycle: moto);
                                        }
                                        if (value == 'delete') {
                                          _deleteMotorcycle(moto);
                                        }
                                      },
                                      itemBuilder: (context) => const [
                                        PopupMenuItem(value: 'edit', child: Text('Editar')),
                                        PopupMenuItem(value: 'delete', child: Text('Excluir')),
                                      ],
                                    )
                                  : null,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }

  String _bloodTypeLabel(BloodType type) {
    switch (type) {
      case BloodType.aPositive:
        return 'A+';
      case BloodType.aNegative:
        return 'A-';
      case BloodType.bPositive:
        return 'B+';
      case BloodType.bNegative:
        return 'B-';
      case BloodType.abPositive:
        return 'AB+';
      case BloodType.abNegative:
        return 'AB-';
      case BloodType.oPositive:
        return 'O+';
      case BloodType.oNegative:
        return 'O-';
    }
  }
}

class _MotorcycleDialog extends StatefulWidget {
  const _MotorcycleDialog({
    this.initial,
    required this.memberId,
  });

  final Motorcycle? initial;
  final int memberId;

  @override
  State<_MotorcycleDialog> createState() => _MotorcycleDialogState();
}

class _MotorcycleDialogState extends State<_MotorcycleDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _modelController;
  late final TextEditingController _yearController;
  late final TextEditingController _colorController;
  late final TextEditingController _plateController;

  @override
  void initState() {
    super.initState();
    _modelController = TextEditingController(text: widget.initial?.model ?? '');
    _yearController = TextEditingController(text: widget.initial?.year.toString() ?? '');
    _colorController = TextEditingController(text: widget.initial?.color ?? '');
    _plateController = TextEditingController(text: widget.initial?.licensePlate ?? '');
  }

  @override
  void dispose() {
    _modelController.dispose();
    _yearController.dispose();
    _colorController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.initial != null;

    return AlertDialog(
      title: Text(isEditing ? 'Editar moto' : 'Nova moto'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _modelController,
                decoration: const InputDecoration(labelText: 'Modelo'),
                validator: _required,
              ),
              TextFormField(
                controller: _yearController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Ano'),
                validator: (value) {
                  if ((value ?? '').trim().isEmpty) {
                    return 'Campo obrigatorio';
                  }
                  final parsed = int.tryParse(value!.trim());
                  if (parsed == null) {
                    return 'Ano invalido';
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _colorController,
                decoration: const InputDecoration(labelText: 'Cor'),
                validator: _required,
              ),
              TextFormField(
                controller: _plateController,
                decoration: const InputDecoration(labelText: 'Placa'),
                validator: _required,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            if (!_formKey.currentState!.validate()) {
              return;
            }
            Navigator.pop(
              context,
              UpsertMotorcyclePayload(
                model: _modelController.text.trim(),
                year: int.parse(_yearController.text.trim()),
                color: _colorController.text.trim(),
                licensePlate: _plateController.text.trim(),
                memberId: widget.memberId,
              ),
            );
          },
          child: Text(isEditing ? 'Salvar' : 'Cadastrar'),
        ),
      ],
    );
  }

  String? _required(String? value) {
    if ((value ?? '').trim().isEmpty) {
      return 'Campo obrigatorio';
    }
    return null;
  }
}
