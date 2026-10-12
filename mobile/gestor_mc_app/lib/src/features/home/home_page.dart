import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestor MC'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: ListTile(
              title: Text('Membros'),
              subtitle: Text('Cadastro e acompanhamento de membros do clube'),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('Eventos e rolês'),
              subtitle: Text('Planejamento de passeios e encontros'),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('Financeiro'),
              subtitle: Text('Mensalidades, despesas e arrecadacoes'),
            ),
          ),
        ],
      ),
    );
  }
}
