import 'package:flutter/material.dart';

import 'member_models.dart';

class MemberFormPage extends StatefulWidget {
  const MemberFormPage({
    super.key,
    this.initial,
  });

  final MemberSummary? initial;

  @override
  State<MemberFormPage> createState() => _MemberFormPageState();
}

class _MemberFormPageState extends State<MemberFormPage> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _nicknameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emergencyController;
  late final TextEditingController _roleController;

  late BloodType _bloodType;
  late MemberStatus _status;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    _nameController = TextEditingController(text: initial?.fullName ?? '');
    _nicknameController = TextEditingController(text: initial?.nickname ?? '');
    _phoneController = TextEditingController(text: initial?.phone ?? '');
    _emergencyController = TextEditingController(text: initial?.emergencyContact ?? '');
    _roleController = TextEditingController(text: initial?.role ?? 'Membro');
    _bloodType = initial?.bloodType ?? BloodType.oPositive;
    _status = initial?.status ?? MemberStatus.ativo;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nicknameController.dispose();
    _phoneController.dispose();
    _emergencyController.dispose();
    _roleController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    Navigator.of(context).pop(
      UpsertMemberPayload(
        fullName: _nameController.text.trim(),
        nickname: _nicknameController.text.trim(),
        phone: _phoneController.text.trim(),
        bloodType: _bloodType,
        emergencyContact: _emergencyController.text.trim(),
        role: _roleController.text.trim(),
        status: _status,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.initial != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Editar membro' : 'Novo membro'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Nome completo'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nicknameController,
              decoration: const InputDecoration(labelText: 'Apelido'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Telefone'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<BloodType>(
              initialValue: _bloodType,
              items: BloodType.values
                  .map(
                    (item) => DropdownMenuItem(
                      value: item,
                      child: Text(_bloodTypeLabel(item)),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _bloodType = value;
                  });
                }
              },
              decoration: const InputDecoration(labelText: 'Tipo sanguineo'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emergencyController,
              decoration: const InputDecoration(labelText: 'Contato de emergencia'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _roleController,
              decoration: const InputDecoration(labelText: 'Cargo'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<MemberStatus>(
              initialValue: _status,
              items: MemberStatus.values
                  .map(
                    (item) => DropdownMenuItem(
                      value: item,
                      child: Text(item == MemberStatus.ativo ? 'Ativo' : 'Inativo'),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _status = value;
                  });
                }
              },
              decoration: const InputDecoration(labelText: 'Status'),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submit,
              child: Text(isEditing ? 'Salvar alteracoes' : 'Cadastrar membro'),
            ),
          ],
        ),
      ),
    );
  }

  String? _required(String? value) {
    if ((value ?? '').trim().isEmpty) {
      return 'Campo obrigatorio';
    }
    return null;
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
