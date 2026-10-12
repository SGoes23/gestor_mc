enum MonthlyFeeStatus { pago, pendente }

MonthlyFeeStatus monthlyFeeStatusFromApi(String value) {
  return value == 'PAGO' ? MonthlyFeeStatus.pago : MonthlyFeeStatus.pendente;
}

String monthlyFeeStatusToApi(MonthlyFeeStatus value) {
  return value == MonthlyFeeStatus.pago ? 'PAGO' : 'PENDENTE';
}

class MonthlyFeeItem {
  final int id;
  final int memberId;
  final String memberFullName;
  final String memberNickname;
  final String referenceMonth;
  final double amount;
  final DateTime dueDate;
  final MonthlyFeeStatus status;
  final DateTime? paymentDate;

  const MonthlyFeeItem({
    required this.id,
    required this.memberId,
    required this.memberFullName,
    required this.memberNickname,
    required this.referenceMonth,
    required this.amount,
    required this.dueDate,
    required this.status,
    required this.paymentDate,
  });

  factory MonthlyFeeItem.fromJson(Map<String, dynamic> json) {
    return MonthlyFeeItem(
      id: json['id'] as int,
      memberId: json['memberId'] as int,
      memberFullName: json['memberFullName'] as String,
      memberNickname: json['memberNickname'] as String,
      referenceMonth: json['referenceMonth'] as String,
      amount: (json['amount'] as num).toDouble(),
      dueDate: DateTime.parse(json['dueDate'] as String),
      status: monthlyFeeStatusFromApi(json['status'] as String),
      paymentDate: json['paymentDate'] == null ? null : DateTime.parse(json['paymentDate'] as String),
    );
  }
}

class GenerateMonthlyFeesResult {
  final String referenceMonth;
  final int created;
  final int existing;

  const GenerateMonthlyFeesResult({
    required this.referenceMonth,
    required this.created,
    required this.existing,
  });

  factory GenerateMonthlyFeesResult.fromJson(Map<String, dynamic> json) {
    return GenerateMonthlyFeesResult(
      referenceMonth: json['referenceMonth'] as String,
      created: json['created'] as int,
      existing: json['existing'] as int,
    );
  }
}
