import 'package:flutter_test/flutter_test.dart';

import 'package:gestor_mc_app/src/app.dart';

void main() {
  testWidgets('shows the Leopardos MC login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const GestorMcApp());

    expect(find.text('Leopardos MC'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
  });
}
