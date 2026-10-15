import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import '../monthly_fees/defaulters_page.dart';
import '../monthly_fees/monthly_fee_service.dart';
import '../monthly_fees/monthly_fees_month_page.dart';
import 'member_detail_page.dart';
import 'member_form_page.dart';
import 'member_models.dart';
import 'member_service.dart';

class MemberListPage extends StatefulWidget {
  const MemberListPage({
    super.key,
    required this.session,
    required this.memberService,
    required this.monthlyFeeService,
    required this.onLogout,
  });

  final AuthSession session;
  final MemberService memberService;
  final MonthlyFeeService monthlyFeeService;
  final VoidCallback onLogout;

  @override
  State<MemberListPage> createState() => _MemberListPageState();
}

class _MemberListPageState extends State<MemberListPage> {
  final _searchController = TextEditingController();
  List<MemberSummary> _members = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMembers() async {
    setState(() => _loading = true);
    try {
      final result = await widget.memberService.listMembers(
        widget.session.token,
        query: _searchController.text,
      );
      if (!mounted) return;
      setState(() {
        _members = result;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao carregar membros: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _openCreateForm() async {
    final payload = await Navigator.of(context).push<UpsertMemberPayload>(
      MaterialPageRoute(builder: (_) => const MemberFormPage()),
    );

    if (payload == null) return;

    try {
      await widget.memberService.createMember(widget.session.token, payload);
      await _loadMembers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao cadastrar membro: $e')),
      );
    }
  }

  Future<void> _openEditForm(MemberSummary member) async {
    final payload = await Navigator.of(context).push<UpsertMemberPayload>(
      MaterialPageRoute(builder: (_) => MemberFormPage(initial: member)),
    );

    if (payload == null) return;

    try {
      await widget.memberService.updateMember(widget.session.token, member.id, payload);
      await _loadMembers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao editar membro: $e')),
      );
    }
  }

  Future<void> _deleteMember(MemberSummary member) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Excluir membro'),
            content: Text('Deseja excluir ${member.fullName}?'),
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
      await widget.memberService.deleteMember(widget.session.token, member.id);
      await _loadMembers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao excluir membro: $e')),
      );
    }
  }

  Future<void> _openDetail(MemberSummary member) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MemberDetailPage(
          memberId: member.id,
          session: widget.session,
          memberService: widget.memberService,
          monthlyFeeService: widget.monthlyFeeService,
        ),
      ),
    );
    await _loadMembers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/images/leopardos_mc_logo.png',
              width: 36,
              height: 36,
              fit: BoxFit.contain,
              semanticLabel: 'Logo do Leopardos Moto Clube',
            ),
            const SizedBox(width: 8),
            const Text('Membros'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => MonthlyFeesMonthPage(
                    session: widget.session,
                    monthlyFeeService: widget.monthlyFeeService,
                  ),
                ),
              );
            },
            icon: const Icon(Icons.calendar_month),
            tooltip: 'Mensalidades do mes',
          ),
          IconButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => DefaultersPage(
                    session: widget.session,
                    monthlyFeeService: widget.monthlyFeeService,
                  ),
                ),
              );
            },
            icon: const Icon(Icons.warning_amber),
            tooltip: 'Inadimplentes',
          ),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(widget.session.profile),
            ),
          ),
          IconButton(
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
          ),
        ],
      ),
      floatingActionButton: widget.session.isDiretoria
          ? FloatingActionButton.extended(
              onPressed: _openCreateForm,
              icon: const Icon(Icons.person_add),
              label: const Text('Novo membro'),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Buscar por nome ou apelido',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onSubmitted: (_) => _loadMembers(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _loadMembers,
                  child: const Text('Buscar'),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadMembers,
                    child: ListView.builder(
                      itemCount: _members.length,
                      itemBuilder: (context, index) {
                        final member = _members[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          child: ListTile(
                            title: Text(member.fullName),
                            subtitle: Text('${member.nickname} | ${member.role}'),
                            onTap: () => _openDetail(member),
                            trailing: widget.session.isDiretoria
                                ? PopupMenuButton<String>(
                                    onSelected: (value) {
                                      if (value == 'edit') {
                                        _openEditForm(member);
                                      }
                                      if (value == 'delete') {
                                        _deleteMember(member);
                                      }
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
          ),
        ],
      ),
    );
  }
}
