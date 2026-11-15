import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import 'cash_models.dart';
import 'cash_service.dart';

class CashPage extends StatefulWidget {
  const CashPage({
    super.key,
    required this.session,
    required this.cashService,
  });

  final AuthSession session;
  final CashService cashService;

  @override
  State<CashPage> createState() => _CashPageState();
}

class _CashPageState extends State<CashPage> {
  CashSummary? _summary;
  List<CashMovementItem> _movements = [];
  bool _loading = true;
  String? _error;
  CashMovementType? _selectedTypeFilter; // null = todos

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

    try {
      final summaryFuture = widget.cashService.getSummary(widget.session.token);
      final movementsFuture = widget.cashService.listMovements(widget.session.token);

      final summary = await summaryFuture;
      final movements = await movementsFuture;

      if (!mounted) return;
      setState(() {
        _summary = summary;
        _movements = movements;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _deleteMovement(CashMovementItem movement) async {
    if (movement.monthlyFeeId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lançamento originado de mensalidade. Para estorná-lo, altere a mensalidade.'),
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir Lançamento'),
        content: Text('Deseja realmente excluir "${movement.description}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await widget.cashService.deleteMovement(widget.session.token, movement.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lançamento excluído com sucesso.')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao excluir: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _openCreateDialog([CashMovementType defaultType = CashMovementType.saida]) {
    showDialog(
      context: context,
      builder: (ctx) => _CreateCashMovementDialog(
        defaultType: defaultType,
        onSave: (type, category, amount, date, description) async {
          Navigator.pop(ctx);
          try {
            await widget.cashService.createMovement(
              widget.session.token,
              type: type,
              category: category,
              amount: amount,
              movementDate: date,
              description: description,
            );
            if (!mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(type == CashMovementType.saida
                    ? 'Despesa registrada com sucesso!'
                    : 'Receita registrada com sucesso!'),
              ),
            );
            _load();
          } catch (e) {
            if (!mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Erro ao salvar: $e'), backgroundColor: Colors.red),
            );
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _movements.where((m) {
      if (_selectedTypeFilter != null && m.type != _selectedTypeFilter) {
        return false;
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fluxo de Caixa & Despesas'),
        actions: [
          IconButton(onPressed: _load, tooltip: 'Atualizar', icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: widget.session.isDiretoria
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateDialog(CashMovementType.saida),
              icon: const Icon(Icons.add),
              label: const Text('Novo Lançamento'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Card(
                color: Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 8),
                      OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
                    ],
                  ),
                ),
              )
            else if (_summary != null) ...[
              // Card Resumo Consolidado
              Card(
                elevation: 3,
                color: const Color(0xFF1F2937),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Saldo Atual em Caixa',
                        style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'R\$ ${_summary!.balance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Divider(color: Colors.white24, height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.arrow_upward, color: Colors.greenAccent, size: 20),
                                const SizedBox(width: 6),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Receitas', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                    Text(
                                      'R\$ ${_summary!.totalIncome.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        color: Colors.greenAccent,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.arrow_downward, color: Colors.redAccent, size: 20),
                                const SizedBox(width: 6),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Despesas', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                    Text(
                                      'R\$ ${_summary!.totalExpense.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        color: Colors.redAccent,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Filtros rápidos
              Row(
                children: [
                  ChoiceChip(
                    label: const Text('Todos'),
                    selected: _selectedTypeFilter == null,
                    onSelected: (val) {
                      if (val) setState(() => _selectedTypeFilter = null);
                    },
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Receitas'),
                    selected: _selectedTypeFilter == CashMovementType.entrada,
                    onSelected: (val) {
                      setState(() => _selectedTypeFilter = val ? CashMovementType.entrada : null);
                    },
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Despesas'),
                    selected: _selectedTypeFilter == CashMovementType.saida,
                    onSelected: (val) {
                      setState(() => _selectedTypeFilter = val ? CashMovementType.saida : null);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Lista de movimentações
              Text(
                'Extrato de Lançamentos (${filtered.length})',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),

              if (filtered.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(
                      child: Text('Nenhuma movimentação registrada.', style: TextStyle(color: Colors.grey)),
                    ),
                  ),
                )
              else
                ...filtered.map((m) {
                  final isIncome = m.type == CashMovementType.entrada;
                  final author = m.createdBy != null
                      ? m.createdBy!.displayName
                      : m.monthlyFeeId != null
                          ? 'Sistema (Mensalidade)'
                          : 'Não registrado';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                backgroundColor: isIncome ? Colors.green.shade50 : Colors.red.shade50,
                                foregroundColor: isIncome ? Colors.green.shade800 : Colors.red.shade800,
                                child: Icon(isIncome ? Icons.arrow_downward : Icons.arrow_upward),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      m.description,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    const SizedBox(height: 4),
                                    Wrap(
                                      spacing: 8,
                                      children: [
                                        Chip(
                                          label: Text(m.category, style: const TextStyle(fontSize: 10)),
                                          padding: EdgeInsets.zero,
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        Text(
                                          '${m.movementDate.day.toString().padLeft(2, '0')}/${m.movementDate.month.toString().padLeft(2, '0')}/${m.movementDate.year}',
                                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${isIncome ? '+' : '-'} R\$ ${m.amount.toStringAsFixed(2)}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: isIncome ? Colors.green.shade800 : Colors.red.shade800,
                                    ),
                                  ),
                                  if (widget.session.isDiretoria && m.monthlyFeeId == null)
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                      tooltip: 'Excluir lançamento',
                                      onPressed: () => _deleteMovement(m),
                                    ),
                                ],
                              ),
                            ],
                          ),
                          const Divider(height: 16),
                          Row(
                            children: [
                              const Icon(Icons.person_outline, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'Lançado por: $author',
                                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ],
        ),
      ),
    );
  }
}

class _CreateCashMovementDialog extends StatefulWidget {
  const _CreateCashMovementDialog({
    required this.defaultType,
    required this.onSave,
  });

  final CashMovementType defaultType;
  final void Function(
    CashMovementType type,
    String category,
    double amount,
    DateTime date,
    String description,
  ) onSave;

  @override
  State<_CreateCashMovementDialog> createState() => _CreateCashMovementDialogState();
}

class _CreateCashMovementDialogState extends State<_CreateCashMovementDialog> {
  late CashMovementType _type;
  late final TextEditingController _categoryController;
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  DateTime _date = DateTime.now();

  static const _categories = ['SEDE', 'EVENTO', 'ALIMENTACAO', 'MANUTENCAO', 'DOACAO', 'OUTROS'];

  @override
  void initState() {
    super.initState();
    _type = widget.defaultType;
    _categoryController = TextEditingController(
      text: _type == CashMovementType.saida ? 'SEDE' : 'DOACAO',
    );
  }

  @override
  void dispose() {
    _categoryController.dispose();
    _amountController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_type == CashMovementType.saida ? 'Nova Despesa' : 'Nova Receita'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SegmentedButton<CashMovementType>(
              segments: const [
                ButtonSegment(value: CashMovementType.saida, label: Text('Despesa')),
                ButtonSegment(value: CashMovementType.entrada, label: Text('Receita')),
              ],
              selected: {_type},
              onSelectionChanged: (set) {
                setState(() {
                  _type = set.first;
                  if (_type == CashMovementType.saida && _categoryController.text == 'DOACAO') {
                    _categoryController.text = 'SEDE';
                  } else if (_type == CashMovementType.entrada && _categoryController.text == 'SEDE') {
                    _categoryController.text = 'DOACAO';
                  }
                });
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputTextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Valor (R\$)',
                border: OutlineInputBorder(),
                prefixText: 'R\$ ',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _categoryController,
              decoration: const InputDecoration(
                labelText: 'Categoria',
                border: OutlineInputBorder(),
                hintText: 'Ex: SEDE, EVENTO, MANUTENCAO',
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: _categories.map((c) {
                return ActionChip(
                  label: Text(c, style: const TextStyle(fontSize: 10)),
                  onPressed: () => setState(() => _categoryController.text = c),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today),
              title: Text('Data: ${_date.day.toString().padLeft(2, '0')}/${_date.month.toString().padLeft(2, '0')}/${_date.year}'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) setState(() => _date = picked);
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Descrição / Justificativa',
                border: OutlineInputBorder(),
                hintText: 'Descreva a origem ou destino do valor...',
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () {
            final amount = double.tryParse(_amountController.text.replaceAll(',', '.')) ?? 0;
            if (amount <= 0) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Informe um valor válido maior que zero.')),
              );
              return;
            }
            if (_descController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Informe a descrição.')),
              );
              return;
            }

            widget.onSave(
              _type,
              _categoryController.text.trim().toUpperCase(),
              amount,
              _date,
              _descController.text.trim(),
            );
          },
          child: const Text('Salvar'),
        ),
      ],
    );
  }
}
