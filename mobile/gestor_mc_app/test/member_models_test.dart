import 'package:flutter_test/flutter_test.dart';
import 'package:gestor_mc_app/src/features/members/member_models.dart';

void main() {
  test('parses members returned before address was added', () {
    final member = MemberSummary.fromJson({
      'id': 1,
      'fullName': 'Joao da Silva',
      'nickname': 'Joao',
      'phone': '11999999999',
      'bloodType': 'O_POSITIVE',
      'emergencyContact': 'Maria da Silva',
      'role': 'Membro',
      'status': 'ATIVO',
    });

    expect(member.fullName, 'Joao da Silva');
    expect(member.address, isEmpty);
  });
}
