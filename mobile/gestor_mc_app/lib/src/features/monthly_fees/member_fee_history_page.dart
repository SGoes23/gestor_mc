import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import 'monthly_fee_models.dart';
import 'monthly_fee_service.dart';

class MemberFeeHistoryPage extends StatefulWidget {
  const MemberFeeHistoryPage({
    super.key,
    required this.memberId,
    required this.memberName,
    required this.session,
    required this.monthlyFeeService,
  });

  final int memberId;
  final String memberName;
  final AuthSession session;
  final MonthlyFeeService monthlyFeeService;

  @override
  State<MemberFeeHistoryPage> createState() => _MemberFeeHistoryPageState();
}

class _MemberFeeHistoryPageState extends State<MemberFeeHistoryPage> {
  bool _loading = true;
  List<MonthlyFeeItem> _items = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await widget.monthlyFeeService.listMemberHistory(widget.session.token, widget.memberId);
      if (!mounted) return;
      setState(() {
        _items = data;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao carregar historico: $e')));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _toggleStatus(MonthlyFeeItem item) async {
    if (!widget.session.isDiretoria) return;
    final next = item.status == MonthlyFeeStatus.pago ? MonthlyFeeStatus.pendente : MonthlyFeeStatus.pago;
    try {
      await widget.monthlyFeeService.updateStatus(
        widget.session.token,
        item.id,
        next,
        paymentDate: next == MonthlyFeeStatus.pago ? DateTime.now() : null,
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao atualizar status: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Historico - ${widget.memberName}'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  final item = _items[index];
                  final paid = item.status == MonthlyFeeStatus.pago;
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: ListTile(
                      title: Text('Ref: ${item.referenceMonth} | R\$ ${item.amount.toStringAsFixed(2)}'),
                      subtitle: Text(
                        paid
                            ? 'Pago em ${item.paymentDate == null ? '-' : _date(item.paymentDate!)}'
                            : 'Pendente - vencimento ${_date(item.dueDate)}',
                      ),
                      trailing: widget.session.isDiretoria
                          ? TextButton(
                              onPressed: () => _toggleStatus(item),
                              child: Text(paid ? 'Marcar pendente' : 'Marcar pago'),
                            )
                          : Chip(label: Text(paid ? 'PAGO' : 'PENDENTE')),
                    ),
                  );
                },
              ),
            ),
    );
  }

  String _date(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }
}
