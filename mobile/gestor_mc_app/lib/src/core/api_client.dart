import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;

  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;

  Uri _uri(String path, [Map<String, String>? query]) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$normalizedPath').replace(queryParameters: query);
  }

  Map<String, String> _headers(String? token) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> get(String path, {String? token, Map<String, String>? query}) async {
    final response = await http.get(_uri(path, query), headers: _headers(token));
    return _parseResponse(response);
  }

  Future<dynamic> post(String path, dynamic body, {String? token}) async {
    final response = await http.post(
      _uri(path),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parseResponse(response);
  }

  Future<dynamic> put(String path, dynamic body, {String? token}) async {
    final response = await http.put(
      _uri(path),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parseResponse(response);
  }

  Future<dynamic> patch(String path, dynamic body, {String? token}) async {
    final response = await http.patch(
      _uri(path),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parseResponse(response);
  }

  Future<void> delete(String path, {String? token}) async {
    final response = await http.delete(_uri(path), headers: _headers(token));
    if (response.statusCode >= 400) {
      throw ApiException(_extractErrorMessage(response.body, response.statusCode));
    }
  }

  dynamic _parseResponse(http.Response response) {
    if (response.statusCode >= 400) {
      throw ApiException(_extractErrorMessage(response.body, response.statusCode));
    }
    if (response.body.isEmpty) {
      return null;
    }
    return jsonDecode(response.body);
  }

  String _extractErrorMessage(String body, int statusCode) {
    if (body.isEmpty) {
      return 'Falha na requisição. Código: $statusCode';
    }
    try {
      final parsed = jsonDecode(body);
      if (parsed is Map && parsed['message'] is String) {
        return parsed['message'] as String;
      }
      return body;
    } catch (_) {
      return body;
    }
  }
}
