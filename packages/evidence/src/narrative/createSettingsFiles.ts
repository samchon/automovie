import { SETTINGS_DOMAINS } from "./internal/SETTINGS_DOMAINS";

/**
 * Selects the settings canon in every supported layout, excluding the outline:
 * the scaffold's `settings/<domain>/<subject>.md` domain folders, numbered
 * `settings/NNN-subject/` folders and legacy flat `settings/*.md`.
 *
 * @evidence contracts/development/implementation.md#principled-implementation One glob per scaffold domain admits the documented domain layout that readSettingsFiles reads, beside the legacy flat glob and the numbered subject-folder glob; the outline subtree matches none of them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The selector only describes canon population from the shared SETTINGS_DOMAINS list; readSettingsFiles and outline validation own concrete ordering and layout checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All three layout forms are supported production formats, not fixture exceptions; the function does not admit arbitrary recursive settings nesting or unknown domain folders.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states domain, numbered and legacy layout coverage and explicitly excludes the outline.
 * @evidence contracts/development/implementation.md#efficient-algorithms The function builds one string per fixed domain plus two, with constant time and space.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each caller receives a separate array; the trivial allocation coordinates no reusable work or mutable shared selection.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned array has a fixed number of entries and no external resource; the function retains no per-call state.
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
