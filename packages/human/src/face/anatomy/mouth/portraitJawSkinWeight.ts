/**
 * Smooth mandibular attachment across the observed oral band in millimetres.
 * A closed or inverted observation retains the four-mm transition used by
 * facial performance; the same field continues onto appended head tissue.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Shares one lower-face attachment weight between facial and cervical performance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Interpolates the observed upper/lower oral heights without assigning maxillary tissue to the jaw.
 */
export function portraitJawSkinWeight(
  y: number,
  upperY: number,
  lowerY: number,
): number {
  if (![y, upperY, lowerY].every(Number.isFinite))
    throw new Error("Jaw attachment heights must be finite millimetres.");
  const offset = upperY - y,
    span = Math.max(4, upperY - lowerY);
  if (![offset, span].every(Number.isFinite))
    throw new Error("Jaw attachment exceeds its finite coordinate domain.");
  const t = Math.max(0, Math.min(1, offset / span));
  return t * t * (3 - 2 * t);
}
