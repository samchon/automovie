/**
 * Finds the first HTML closing marker, including a malformed inline close.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Scan from start to the first literal HTML close, including malformed inline closes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper finds boundaries; callers decide their structural validity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Malformed closes are not skipped to convenient later delimiters.
 * @evidence contracts/development/common.md#meaningful-documentation The comment specifies first-marker behavior; -1 denotes no marker.
 * @evidence contracts/development/implementation.md#efficient-algorithms Characters up to the first close or EOF are examined with constant auxiliary space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each scan depends on current lines and start, without shared cached boundaries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No state survives the call.
 */
export function findClose(lines: string[], start: number): number {
  for (let index: number = start; index < lines.length; index += 1)
    if (lines[index].includes("-->")) return index;
  return -1;
}
