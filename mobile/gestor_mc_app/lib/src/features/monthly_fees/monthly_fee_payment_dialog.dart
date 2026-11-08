import 'package:flutter/material.dart';

import 'monthly_fee_models.dart';

Future<bool?> showMonthlyFeePaymentDialog(
  BuildContext context,
  MonthlyFeeItem item,
) {
  return showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Confirmar pagamento'),
      content: Text(
        'Você deseja alterar o status da Mensalidade de "${item.memberFullName}"?\n\n'
        'Valor: R\$ ${item.amount.toStringAsFixed(2)}',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancelar'),
        ),
        OutlinedButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Apenas marcar'),
        ),
        FilledButton.icon(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          icon: const Icon(Icons.account_balance_wallet_outlined),
          label: const Text('Marcar e injetar no caixa'),
        ),
      ],
    ),
  );
}
