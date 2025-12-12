/**
 * 通用提示工具
 */

import { confirm, input } from '@inquirer/prompts';

export async function editBoolean(message: string, currentValue: boolean): Promise<boolean> {
  return await confirm({
    message: `${message} (当前: ${currentValue ? '是' : '否'})`,
    default: currentValue
  });
}

export async function editNumber(
  message: string,
  currentValue: number,
  validate?: (value: string) => boolean | string
): Promise<number> {
  const result = await input({
    message: `${message} (当前: ${currentValue})`,
    default: String(currentValue),
    validate
  });
  return parseInt(result, 10);
}

export async function editString(
  message: string,
  currentValue: string,
  validate?: (value: string) => boolean | string
): Promise<string> {
  return await input({
    message: `${message}`,
    default: currentValue,
    validate
  });
}

export function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

export function formatBoolean(value: boolean): string {
  return value ? '✓ 启用' : '✗ 禁用';
}
