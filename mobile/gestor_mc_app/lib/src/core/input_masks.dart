import 'package:flutter/services.dart';

String formatPhoneValue(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  final limited = digits.substring(0, digits.length > 11 ? 11 : digits.length);
  if (limited.isEmpty) return '';
  if (limited.length <= 2) return '($limited';
  final local = limited.substring(2);
  final prefixLength = limited.length == 11 ? 5 : 4;
  final actualPrefixLength = local.length < prefixLength ? local.length : prefixLength;
  final prefix = local.substring(0, actualPrefixLength);
  final suffix = local.substring(actualPrefixLength);
  return '(${limited.substring(0, 2)}) $prefix${suffix.isEmpty ? '' : '-$suffix'}';
}

class PhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final formatted = formatPhoneValue(newValue.text);
    return TextEditingValue(text: formatted, selection: TextSelection.collapsed(offset: formatted.length));
  }
}

class PostalCodeInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final limited = digits.substring(0, digits.length > 8 ? 8 : digits.length);
    final formatted = limited.length > 5 ? '${limited.substring(0, 5)}-${limited.substring(5)}' : limited;
    return TextEditingValue(text: formatted, selection: TextSelection.collapsed(offset: formatted.length));
  }
}

String formatCpfValue(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  final limited = digits.substring(0, digits.length > 11 ? 11 : digits.length);
  final buffer = StringBuffer();
  for (var index = 0; index < limited.length; index++) {
    if (index == 3 || index == 6) buffer.write('.');
    if (index == 9) buffer.write('-');
    buffer.write(limited[index]);
  }
  return buffer.toString();
}

class CpfInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final formatted = formatCpfValue(newValue.text);
    return TextEditingValue(text: formatted, selection: TextSelection.collapsed(offset: formatted.length));
  }
}
