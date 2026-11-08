import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/input_masks.dart';
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
  late final TextEditingController _addressController;
  late final TextEditingController _postalCodeController;
  late final TextEditingController _cpfController;
  late final TextEditingController _roleController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  late BloodType _bloodType;
  late MemberStatus _status;
  late MemberAccessProfile _profile;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    _nameController = TextEditingController(text: initial?.fullName ?? '');
    _nicknameController = TextEditingController(text: initial?.nickname ?? '');
    _phoneController = TextEditingController(text: formatPhoneValue(initial?.phone ?? ''));
    _emergencyController = TextEditingController(text: formatPhoneValue(initial?.emergencyContact ?? ''));
    _addressController = TextEditingController(text: initial?.address ?? '');
    _postalCodeController = TextEditingController(text: _formatPostalCode(initial?.postalCode ?? ''));
    _cpfController = TextEditingController(text: formatCpfValue(initial?.cpf ?? ''));
    _roleController = TextEditingController(text: initial?.role ?? 'Membro');
    _emailController = TextEditingController(text: initial?.email ?? '');
    _passwordController = TextEditingController();
    _bloodType = initial?.bloodType ?? BloodType.oPositive;
    _status = initial?.status ?? MemberStatus.ativo;
    _profile = initial?.profile ?? MemberAccessProfile.membro;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nicknameController.dispose();
    _phoneController.dispose();
    _emergencyController.dispose();
    _addressController.dispose();
    _postalCodeController.dispose();
    _cpfController.dispose();
    _roleController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
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
        address: _addressController.text.trim(),
        postalCode: _postalCodeController.text.trim(),
        cpf: _cpfController.text.trim(),
        role: _roleController.text.trim(),
        status: _status,
        email: _emailController.text.trim(),
        password: _passwordController.text.isEmpty ? null : _passwordController.text,
        profile: _profile,
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
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, PhoneInputFormatter()],
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
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, PhoneInputFormatter()],
              decoration: const InputDecoration(labelText: 'Contato de emergencia'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'Endereco'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _postalCodeController,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, PostalCodeInputFormatter()],
              decoration: const InputDecoration(labelText: 'CEP (opcional)', hintText: '00000-000'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _cpfController,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, CpfInputFormatter()],
              decoration: const InputDecoration(labelText: 'CPF (opcional)', hintText: '000.000.000-00'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _roleController,
              decoration: const InputDecoration(labelText: 'Cargo'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<MemberAccessProfile>(
              initialValue: _profile,
              items: MemberAccessProfile.values
                  .map((item) => DropdownMenuItem(value: item, child: Text(_profileLabel(item))))
                  .toList(),
              onChanged: (value) {
                if (value != null) setState(() => _profile = value);
              },
              decoration: const InputDecoration(labelText: 'Perfil de acesso'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'E-mail de acesso'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              decoration: InputDecoration(labelText: isEditing ? 'Nova senha (opcional)' : 'Senha inicial'),
              validator: isEditing ? null : _required,
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

  String _formatPostalCode(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.length <= 5) return digits;
    final limited = digits.substring(0, digits.length > 8 ? 8 : digits.length);
    return '${limited.substring(0, 5)}-${limited.substring(5)}';
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

  String _profileLabel(MemberAccessProfile profile) {
    switch (profile) {
      case MemberAccessProfile.membro:
        return 'Membro';
      case MemberAccessProfile.diretoria:
        return 'Diretoria';
      case MemberAccessProfile.administrativo:
        return 'Administrativo';
    }
  }
}
