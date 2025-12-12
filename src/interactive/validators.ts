/**
 * 输入验证器
 */

export function validateUrl(value: string): boolean | string {
  if (!value) return 'URL 不能为空';
  try {
    new URL(value);
    return true;
  } catch {
    return '请输入有效的 URL';
  }
}

export function validatePositiveNumber(value: string): boolean | string {
  const num = parseInt(value, 10);
  if (isNaN(num)) return '请输入有效的数字';
  if (num < 0) return '数字必须为正数';
  return true;
}

export function validateMinDuration(value: string): boolean | string {
  const num = parseInt(value, 10);
  if (isNaN(num)) return '请输入有效的数字';
  if (num < 0) return '时长必须为正数';
  if (num > 3600) return '时长不应超过 3600 秒（1 小时）';
  return true;
}

export function validateSessionCleanupDays(value: string): boolean | string {
  const num = parseInt(value, 10);
  if (isNaN(num)) return '请输入有效的数字';
  if (num < 1) return '天数至少为 1';
  if (num > 365) return '天数不应超过 365';
  return true;
}
