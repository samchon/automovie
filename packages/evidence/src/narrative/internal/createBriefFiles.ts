import { SETTINGS_DOMAINS } from "./SETTINGS_DOMAINS";

/*
 * Selects a short's brief canon: the scaffold's domain folders under
 * `docs/body/brief`.
 *
 * The brief keeps the settings domain layout, `brief/<domain>/<subject>.md`, so
 * the same reader, which refuses mixed layouts, and the same citations serve
 * both canon layers.
 */
export function createBriefFiles(): string[] {
  return SETTINGS_DOMAINS.map(
    (domain: string): string => `brief/${domain}/*.md`,
  );
}
