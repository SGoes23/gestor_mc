enum MemberStatus { ativo, inativo }

enum BloodType {
  aPositive,
  aNegative,
  bPositive,
  bNegative,
  abPositive,
  abNegative,
  oPositive,
  oNegative,
}

String bloodTypeToApi(BloodType value) {
  switch (value) {
    case BloodType.aPositive:
      return 'A_POSITIVE';
    case BloodType.aNegative:
      return 'A_NEGATIVE';
    case BloodType.bPositive:
      return 'B_POSITIVE';
    case BloodType.bNegative:
      return 'B_NEGATIVE';
    case BloodType.abPositive:
      return 'AB_POSITIVE';
    case BloodType.abNegative:
      return 'AB_NEGATIVE';
    case BloodType.oPositive:
      return 'O_POSITIVE';
    case BloodType.oNegative:
      return 'O_NEGATIVE';
  }
}

BloodType bloodTypeFromApi(String value) {
  switch (value) {
    case 'A_POSITIVE':
      return BloodType.aPositive;
    case 'A_NEGATIVE':
      return BloodType.aNegative;
    case 'B_POSITIVE':
      return BloodType.bPositive;
    case 'B_NEGATIVE':
      return BloodType.bNegative;
    case 'AB_POSITIVE':
      return BloodType.abPositive;
    case 'AB_NEGATIVE':
      return BloodType.abNegative;
    case 'O_POSITIVE':
      return BloodType.oPositive;
    case 'O_NEGATIVE':
      return BloodType.oNegative;
    default:
      return BloodType.oPositive;
  }
}

String memberStatusToApi(MemberStatus value) {
  return value == MemberStatus.ativo ? 'ATIVO' : 'INATIVO';
}

MemberStatus memberStatusFromApi(String value) {
  return value == 'INATIVO' ? MemberStatus.inativo : MemberStatus.ativo;
}

class Motorcycle {
  final int id;
  final String model;
  final int year;
  final String color;
  final String licensePlate;
  final int memberId;

  const Motorcycle({
    required this.id,
    required this.model,
    required this.year,
    required this.color,
    required this.licensePlate,
    required this.memberId,
  });

  factory Motorcycle.fromJson(Map<String, dynamic> json) {
    return Motorcycle(
      id: json['id'] as int,
      model: json['model'] as String,
      year: json['year'] as int,
      color: json['color'] as String,
      licensePlate: json['licensePlate'] as String,
      memberId: json['memberId'] as int,
    );
  }
}

class MemberSummary {
  final int id;
  final String fullName;
  final String nickname;
  final String phone;
  final BloodType bloodType;
  final String emergencyContact;
  final String role;
  final MemberStatus status;

  const MemberSummary({
    required this.id,
    required this.fullName,
    required this.nickname,
    required this.phone,
    required this.bloodType,
    required this.emergencyContact,
    required this.role,
    required this.status,
  });

  factory MemberSummary.fromJson(Map<String, dynamic> json) {
    return MemberSummary(
      id: json['id'] as int,
      fullName: json['fullName'] as String,
      nickname: json['nickname'] as String,
      phone: json['phone'] as String,
      bloodType: bloodTypeFromApi(json['bloodType'] as String),
      emergencyContact: json['emergencyContact'] as String,
      role: json['role'] as String,
      status: memberStatusFromApi(json['status'] as String),
    );
  }
}

class MemberDetail extends MemberSummary {
  final List<Motorcycle> motorcycles;

  const MemberDetail({
    required super.id,
    required super.fullName,
    required super.nickname,
    required super.phone,
    required super.bloodType,
    required super.emergencyContact,
    required super.role,
    required super.status,
    required this.motorcycles,
  });

  factory MemberDetail.fromJson(Map<String, dynamic> json) {
    return MemberDetail(
      id: json['id'] as int,
      fullName: json['fullName'] as String,
      nickname: json['nickname'] as String,
      phone: json['phone'] as String,
      bloodType: bloodTypeFromApi(json['bloodType'] as String),
      emergencyContact: json['emergencyContact'] as String,
      role: json['role'] as String,
      status: memberStatusFromApi(json['status'] as String),
      motorcycles: (json['motorcycles'] as List<dynamic>)
          .map((item) => Motorcycle.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class UpsertMemberPayload {
  final String fullName;
  final String nickname;
  final String phone;
  final BloodType bloodType;
  final String emergencyContact;
  final String role;
  final MemberStatus status;

  const UpsertMemberPayload({
    required this.fullName,
    required this.nickname,
    required this.phone,
    required this.bloodType,
    required this.emergencyContact,
    required this.role,
    required this.status,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'nickname': nickname,
      'phone': phone,
      'bloodType': bloodTypeToApi(bloodType),
      'emergencyContact': emergencyContact,
      'role': role,
      'status': memberStatusToApi(status),
    };
  }
}

class UpsertMotorcyclePayload {
  final String model;
  final int year;
  final String color;
  final String licensePlate;
  final int memberId;

  const UpsertMotorcyclePayload({
    required this.model,
    required this.year,
    required this.color,
    required this.licensePlate,
    required this.memberId,
  });

  Map<String, dynamic> toJson() {
    return {
      'model': model,
      'year': year,
      'color': color,
      'licensePlate': licensePlate,
      'memberId': memberId,
    };
  }
}
