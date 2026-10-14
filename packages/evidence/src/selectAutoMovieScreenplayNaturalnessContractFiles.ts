


/** Selects audience-language contracts for final screenplay revision.
 *
 * @evidence contracts/common.md#principled-implementation Three required core, story and language naturalness routes select project-owned documents for final-screenplay audience-language contracts; this selector creates no document or pack.
 * @evidence contracts/common.md#clear-and-simple-design A dedicated selector keeps final revision targets apart from construction principles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only declared required routes appear; resident document admission belongs to the graph and no manuscript text or fixture-specific rule is inserted.
 * @evidence contracts/common.md#meaningful-documentation The comment states audience-language final screenplay selection.
 * @evidence contracts/performance.md#efficient-algorithms Returning three path strings is O(1) work and fixed-size storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Naturalness reference construction shares this one selector; no parse result or source cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns a fresh three-path array with no handle or task.
 */
export function selectAutoMovieScreenplayNaturalnessContractFiles(): string[] {
  return [
    "naturalness/core/common.md",
    "naturalness/story/screenplays.md",
    "language/naturalness/screenplays.md",
  ];
}
