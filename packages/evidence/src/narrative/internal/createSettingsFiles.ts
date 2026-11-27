import { SETTINGS_DOMAINS } from "./SETTINGS_DOMAINS";

/*
 * Selects the settings canon in every supported layout, excluding the outline:
 * the scaffold's `settings/<domain>/<subject>.md` domain folders, numbered
 * `settings/NNN-subject/` folders and legacy flat `settings/*.md`.
 */
export function createSettingsFiles(): string[] {
  return [
    "settings/*.md",
    "settings/???-*/*.md",
    ...SETTINGS_DOMAINS.map(
      (domain: string): string => `settings/${domain}/*.md`,
    ),
  ];
}
