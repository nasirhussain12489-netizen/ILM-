export type SettingRecord = {
  settingKey?: string | null;
  settingValue?: string | null;
};

export function normalizeSettingsMap(
  records?: Array<SettingRecord | null | undefined> | null
): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (!Array.isArray(records)) {
    return normalized;
  }

  for (const record of records) {
    if (!record || typeof record !== 'object') {
      continue;
    }

    const settingKey = String(record.settingKey ?? '').trim();
    if (!settingKey) {
      continue;
    }

    normalized[settingKey] = typeof record.settingValue === 'string' ? record.settingValue : '';
  }

  return normalized;
}

export function safeObjectEntries<T extends Record<string, unknown> | null | undefined>(
  obj: T
): [string, unknown][] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  return Object.entries(obj as Record<string, unknown>);
}
