/**
 * Smooth mandibular attachment across the observed oral band in millimetres. A closed or inverted observation retains the four-mm transition used by facial performance; the same field continues onto appended head tissue.
 *
 * @evidence contracts/common.md#principled-implementation A smoothstep attaches lower oral tissue across the observed upper-to-lower height band.
 * @evidence contracts/common.md#clear-and-simple-design Facial performance and appended jaw continuation reuse one attachment responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four-millimetre minimum transition is a stated numerical convention, not recovered muscle weight.
 * @evidence contracts/common.md#meaningful-documentation Inputs are head millimetres, with clamped output in the unit weight interval and finite arithmetic admission.
 * @evidence contracts/performance.md#efficient-algorithms A fixed finite check, subtraction and polynomial take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work One weight owner keeps face and neck continuation from using different band transitions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes and no mesh or measurement record is retained.
 */
export function portraitJawSkinWeight(
  y: number,
  upperY: number,
  lowerY: number,
): number {
  if (![y, upperY, lowerY].every(Number.isFinite))
    throw new Error("Jaw attachment heights must be finite millimetres.");
  const offset: number = upperY - y,
    span: number = Math.max(4, upperY - lowerY);
  if (![offset, span].every(Number.isFinite))
    throw new Error("Jaw attachment exceeds its finite coordinate domain.");
  const t: number = Math.max(0, Math.min(1, offset / span));
  return t * t * (3 - 2 * t);
}
