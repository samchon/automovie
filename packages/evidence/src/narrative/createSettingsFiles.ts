/**
 * Selects flat legacy canon and one level of numbered subject folders, excluding the outline.
 *
 * @evidence contracts/common.md#principled-implementation Two relative globs admit legacy flat settings and one numbered subject-folder level while excluding the separately owned outline subtree.
 * @evidence contracts/common.md#clear-and-simple-design The selector only describes canon population; readSettingsFiles and outline validation own concrete ordering and layout checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both layout forms are supported production formats, not fixture exceptions; the function does not admit arbitrary recursive settings nesting.
 * @evidence contracts/common.md#meaningful-documentation The comment states legacy and classified layout coverage and explicitly excludes the outline.
 * @evidence contracts/performance.md#efficient-algorithms The function constructs two fixed strings and one two-element array with constant time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller receives a separate array; the trivial allocation coordinates no reusable work or mutable shared selection.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned array has two entries and no external resource; the function retains no per-call state.
 */
export function createSettingsFiles(): string[] {
  return ["settings/*.md", "settings/???-*/*.md"];
}
