import { SETTINGS_DOMAINS } from "./internal/SETTINGS_DOMAINS";

/**
 * Selects a short's brief canon: the scaffold's domain folders under `docs/body/brief`.
 *
 * The brief keeps the settings domain layout, `brief/<domain>/<subject>.md`,
 * with the work's fixed conditions in `brief/world/work.md`, so the same reader,
 * which refuses mixed layouts, and the same citations serve both canon layers.
 *
 * @evidence contracts/development/implementation.md#principled-implementation One glob per scaffold domain admits the brief's canon, sharing SETTINGS_DOMAINS with the settings selector and reader so the layouts cannot drift; no top-level glob is admitted because the reader refuses a mixed layout.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The selector only describes the brief population; the shared reader owns concrete ordering and layout checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the declared domain folders are admitted; arbitrary nesting is not.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the brief root, its domain layout and why it matches settings.
 * @evidence contracts/development/implementation.md#efficient-algorithms The result has one entry per domain, built in time linear in the fixed domain list.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each caller receives a separate array; the trivial allocation coordinates no reusable work or mutable shared selection.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned array is bounded by the fixed domain list and the function retains no per-call state.
 */
export function createBriefFiles(): string[] {
  return SETTINGS_DOMAINS.map(
    (domain: string): string => `brief/${domain}/*.md`,
  );
}
