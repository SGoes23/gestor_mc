import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import 'monthly_fee_models.dart';
import 'monthly_fee_service.dart';

class DefaultersPage extends StatefulWidget {
  const DefaultersPage({
    super.key,
    required this.session,
    required this.monthlyFeeService,
  });

  final AuthSession session;
  final MonthlyFeeService monthlyFeeService;

  @override
  State<DefaultersPage> createState() => _DefaultersPageState();
}

class _DefaultersPageState extends State<DefaultersPage> {
  late final TextEditingController _monthController;
  bool _loading = true;
  List<MonthlyFeeItem> _items = const [];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _monthController = TextEditingController(text: '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}');
    _load();
  }

  @override
  void dispose() {
    _monthController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await widget.monthlyFeeService.listDefaulters(widget.session.token, _monthController.text.trim());
      if (!mounted) return;
      setState(() {
        _items = data;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao consultar inadimplentes: $e')));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inadimplentes')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
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
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          child: ListTile(
                            title: Text(item.memberFullName),
                            subtitle: Text('${item.memberNickname} | R\$ ${item.amount.toStringAsFixed(2)} | Venc: ${_date(item.dueDate)}'),
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

  String _date(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }
}
