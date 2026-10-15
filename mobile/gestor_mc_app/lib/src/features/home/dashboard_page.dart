import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import '../events/event_models.dart';
import '../events/event_service.dart';
import '../events/events_page.dart';
import '../members/member_list_page.dart';
import '../members/member_models.dart';
import '../members/member_service.dart';
import '../monthly_fees/monthly_fee_models.dart';
import '../monthly_fees/monthly_fee_service.dart';
import '../monthly_fees/monthly_fees_month_page.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({
    super.key,
    required this.session,
    required this.memberService,
    required this.monthlyFeeService,
    required this.eventService,
    required this.onLogout,
  });

  final AuthSession session;
  final MemberService memberService;
  final MonthlyFeeService monthlyFeeService;
  final EventService eventService;
  final VoidCallback onLogout;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  List<MemberSummary> _members = const [];
  List<MonthlyFeeItem> _defaulters = const [];
  List<ClubEvent> _events = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final now = DateTime.now();
    final month = '${now.year}-${now.month.toString().padLeft(2, '0')}';
    try {
      final membersFuture = widget.memberService.listMembers(widget.session.token);
      final defaultersFuture = widget.monthlyFeeService.listDefaulters(widget.session.token, month);
      final eventsFuture = widget.eventService.listEvents(widget.session.token);
      final members = await membersFuture;
      final defaulters = await defaultersFuture;
      final events = await eventsFuture;
      if (!mounted) return;
      setState(() {
        _members = members;
        _defaulters = defaulters;
        _events = events;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Nao foi possivel carregar o dashboard: $error');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _openMembers() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MemberListPage(
          session: widget.session,
          memberService: widget.memberService,
          monthlyFeeService: widget.monthlyFeeService,
          onLogout: widget.onLogout,
        ),
      ),
    );
  }

  void _openEvents() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EventsPage(session: widget.session, eventService: widget.eventService),
      ),
    );
  }

  void _openMonthlyFees() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MonthlyFeesMonthPage(
          session: widget.session,
          monthlyFeeService: widget.monthlyFeeService,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeMembers = _members.where((member) => member.status == MemberStatus.ativo).length;
    final now = DateTime.now();
    final monthlyMeetings = _events.where(
      (event) =>
          event.type == ClubEventType.reuniao &&
          event.eventDate.year == now.year &&
          event.eventDate.month == now.month,
    ).length;

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
            const Text('Leopardos MC'),
          ],
        ),
        actions: [
          IconButton(onPressed: _load, tooltip: 'Atualizar dashboard', icon: const Icon(Icons.refresh)),
          IconButton(onPressed: widget.onLogout, tooltip: 'Sair', icon: const Icon(Icons.logout)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Dashboard', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              )
            else ...[
              _MetricCard(
                icon: Icons.groups,
                title: 'Membros ativos',
                value: '$activeMembers',
                subtitle: 'de ${_members.length} membros cadastrados',
              ),
              _MetricCard(
                icon: Icons.groups_2,
                title: 'Reunioes neste mes',
                value: '$monthlyMeetings',
                subtitle: 'conforme o calendario',
              ),
              const Card(
                child: ListTile(
                  leading: Icon(Icons.account_balance_wallet_outlined),
                  title: Text('Caixa do clube'),
                  subtitle: Text('Aguardando o registro de movimentacoes financeiras.'),
                ),
              ),
              const SizedBox(height: 16),
              Text('Mensalidades em atraso', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (_defaulters.isEmpty)
                const Card(child: ListTile(title: Text('Nenhuma mensalidade pendente neste mes.')))
              else
                ..._defaulters.map((fee) => _DefaulterCard(fee: fee)),
            ],
            const SizedBox(height: 24),
            Text('Acessos rapidos', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _NavigationCard(
              icon: Icons.dashboard_outlined,
              title: 'Dashboard',
              subtitle: 'Visao geral do clube',
              onTap: _load,
            ),
            _NavigationCard(
              icon: Icons.people_outline,
              title: 'Membros',
              subtitle: 'Cadastros, motos e dados dos integrantes',
              onTap: _openMembers,
            ),
            _NavigationCard(
              icon: Icons.calendar_month_outlined,
              title: 'Calendario de eventos',
              subtitle: 'Eventos, passeios e reunioes',
              onTap: _openEvents,
            ),
            _NavigationCard(
              icon: Icons.payments_outlined,
              title: 'Mensalidades',
              subtitle: 'Pagamentos e inadimplencia',
              onTap: _openMonthlyFees,
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: Text(value, style: Theme.of(context).textTheme.headlineSmall),
      ),
    );
  }
}

class _DefaulterCard extends StatelessWidget {
  const _DefaulterCard({required this.fee});

  final MonthlyFeeItem fee;

  @override
  Widget build(BuildContext context) {
    final daysOverdue = DateTime.now().difference(fee.dueDate).inDays;
    final overdueLabel = daysOverdue > 0 ? '$daysOverdue dias em atraso' : 'Vence hoje ou nos proximos dias';
    return Card(
      child: ListTile(
        leading: const Icon(Icons.warning_amber, color: Colors.red),
        title: Text(fee.memberFullName),
        subtitle: Text('$overdueLabel | R\$ ${fee.amount.toStringAsFixed(2)}'),
      ),
    );
  }
}

class _NavigationCard extends StatelessWidget {
  const _NavigationCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
