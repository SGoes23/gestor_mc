import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import 'monthly_fee_models.dart';
import 'monthly_fee_service.dart';

class MonthlyFeesMonthPage extends StatefulWidget {
  const MonthlyFeesMonthPage({
    super.key,
    required this.session,
    required this.monthlyFeeService,
  });

  final AuthSession session;
  final MonthlyFeeService monthlyFeeService;

  @override
  State<MonthlyFeesMonthPage> createState() => _MonthlyFeesMonthPageState();
}

class _MonthlyFeesMonthPageState extends State<MonthlyFeesMonthPage> {
  late final TextEditingController _monthController;
  final _amountController = TextEditingController(text: '50.00');
  final _dueDateController = TextEditingController();
  List<MonthlyFeeItem> _items = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _monthController = TextEditingController(text: _monthText(now));
    _dueDateController.text = _dateText(DateTime(now.year, now.month, 10));
    _load();
  }

  @override
  void dispose() {
    _monthController.dispose();
    _amountController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await widget.monthlyFeeService.listByMonth(widget.session.token, _monthController.text.trim());
      if (!mounted) return;
      setState(() {
        _items = data;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao carregar mensalidades: $e')));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _generate() async {
    final amount = double.tryParse(_amountController.text.replaceAll(',', '.'));
    final due = _parseDate(_dueDateController.text.trim());
    if (amount == null || due == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Valor ou vencimento invalido')),
      );
      return;
    }

    try {
      final result = await widget.monthlyFeeService.generateMonthlyFees(
        widget.session.token,
        referenceMonth: _monthController.text.trim(),
        amount: amount,
        dueDate: due,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Geradas ${result.created}, existentes ${result.existing} para ${result.referenceMonth}')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao gerar mensalidades: $e')));
    }
  }

  Future<void> _toggleStatus(MonthlyFeeItem item) async {
    final next = item.status == MonthlyFeeStatus.pendente ? MonthlyFeeStatus.pago : MonthlyFeeStatus.pendente;
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
    final isDiretoria = widget.session.isDiretoria;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mensalidades do mes'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _monthController,
                        decoration: const InputDecoration(labelText: 'Mes referencia (YYYY-MM)'),
                        onSubmitted: (_) => _load(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(onPressed: _load, child: const Text('Consultar')),
                  ],
                ),
                if (isDiretoria) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _amountController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(labelText: 'Valor padrao'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _dueDateController,
                          decoration: const InputDecoration(labelText: 'Vencimento (YYYY-MM-DD)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton.icon(
                      onPressed: _generate,
                      icon: const Icon(Icons.auto_awesome),
                      label: const Text('Gerar mensalidades do mes'),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: _loading
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
                            title: Text(item.memberFullName),
                            subtitle: Text(
                              '${item.memberNickname} | R\$ ${item.amount.toStringAsFixed(2)} | Venc: ${_dateText(item.dueDate)}',
                            ),
                            trailing: isDiretoria
                                ? ActionChip(
                                    onPressed: () => _toggleStatus(item),
                                    avatar: Icon(
                                      paid ? Icons.check_circle : Icons.error,
                                      color: paid ? Colors.green : Colors.red,
                                    ),
                                    backgroundColor: paid ? Colors.green.shade50 : Colors.red.shade50,
                                    label: Text(paid ? 'PAGO' : 'PENDENTE'),
                                  )
                                : Chip(
                                    avatar: Icon(
                                      paid ? Icons.check_circle : Icons.error,
                                      color: paid ? Colors.green : Colors.red,
                                    ),
                                    backgroundColor: paid ? Colors.green.shade50 : Colors.red.shade50,
                                    label: Text(paid ? 'PAGO' : 'PENDENTE'),
                                  ),
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

  String _monthText(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    return '$y-$m';
  }

  String _dateText(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  DateTime? _parseDate(String text) {
    try {
      final p = text.split('-');
      if (p.length != 3) return null;
      return DateTime(int.parse(p[0]), int.parse(p[1]), int.parse(p[2]));
    } catch (_) {
      return null;
    }
  }
}
