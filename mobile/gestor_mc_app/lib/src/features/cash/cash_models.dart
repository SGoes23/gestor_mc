enum CashMovementType { entrada, saida }

CashMovementType cashMovementTypeFromApi(String value) {
  return value == 'ENTRADA' ? CashMovementType.entrada : CashMovementType.saida;
}

String cashMovementTypeToApi(CashMovementType value) {
  return value == CashMovementType.entrada ? 'ENTRADA' : 'SAIDA';
}

class CashSummary {
  final double balance;
  final double totalIncome;
  final double totalExpense;

  const CashSummary({
    required this.balance,
    required this.totalIncome,
    required this.totalExpense,
  });

  factory CashSummary.fromJson(Map<String, dynamic> json) {
    return CashSummary(
      balance: (json['balance'] as num).toDouble(),
      totalIncome: (json['totalIncome'] as num).toDouble(),
      totalExpense: (json['totalExpense'] as num).toDouble(),
    );
  }
}

class CashMovementCreatedBy {
  final int id;
  final String email;
  final String? memberName;
  final String? memberNickname;

  const CashMovementCreatedBy({
    required this.id,
    required this.email,
    this.memberName,
    this.memberNickname,
  });

  factory CashMovementCreatedBy.fromJson(Map<String, dynamic> json) {
    return CashMovementCreatedBy(
      id: json['id'] as int,
      email: json['email'] as String,
      memberName: json['memberName'] as String?,
      memberNickname: json['memberNickname'] as String?,
    );
  }

  String get displayName {
    if (memberName != null && memberName!.isNotEmpty) {
      if (memberNickname != null && memberNickname!.isNotEmpty) {
        return '$memberName ($memberNickname)';
      }
      return memberName!;
    }
    return email;
  }
}

class CashMovementItem {
  final int id;
  final int? monthlyFeeId;
  final CashMovementType type;
  final String category;
  final double amount;
  final DateTime movementDate;
  final String description;
  final CashMovementCreatedBy? createdBy;
  final DateTime? createdAt;

  const CashMovementItem({
    required this.id,
    this.monthlyFeeId,
    required this.type,
    required this.category,
    required this.amount,
    required this.movementDate,
    required this.description,
    this.createdBy,
    this.createdAt,
  });

  factory CashMovementItem.fromJson(Map<String, dynamic> json) {
    return CashMovementItem(
      id: json['id'] as int,
      monthlyFeeId: json['monthlyFeeId'] as int?,
      type: cashMovementTypeFromApi(json['type'] as String),
      category: json['category'] as String,
      amount: (json['amount'] as num).toDouble(),
      movementDate: DateTime.parse(json['movementDate'] as String),
      description: json['description'] as String,
      createdBy: json['createdBy'] != null
          ? CashMovementCreatedBy.fromJson(json['createdBy'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
    );
  }
}
