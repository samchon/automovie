/**
 * Validate every original column scale, including sparse-array holes.
 *
 * @evidence contracts/common.md#principled-implementation Current D has one positive finite camera scale and three positive finite scales per ordered point. Indexed traversal treats missing entries as malformed ownership rather than optional arithmetic absence.
 * @evidence contracts/common.md#clear-and-simple-design Assembly, optional formation and shared triangular actions use one scale contract at their own entry boundaries; factors and rows have separate validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No skipped array hole, inferred scale, floor or caught numerical failure supplies a missing owned coefficient.
 * @evidence contracts/common.md#meaningful-documentation Borrows camera/point scale arrays and throws on invalid shape or any missing, zero or nonfinite value; valid inputs may still overflow later arithmetic.
 * @evidence contracts/performance.md#efficient-algorithms One O(C+L) indexed pass fits the owner's prepaid invariant checks, without rescanning factors per physical row.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mutable borrowed arrays are checked at the owning operation rather than cached across models.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only scalar indices and a borrowed point-row reference live during this call; no array copy or external resource transfers.
 */
export function validateRecoveryMapMetricScales(
  cameraScales: readonly number[],
  pointScales: readonly (readonly number[])[],
): void {
  if (
    cameraScales.length < 1 ||
    !Number.isSafeInteger(cameraScales.length + 3 * pointScales.length)
  )
    throw new Error(
      "camera-feasible: matching positive original scales required",
    );
  for (let axis: number = 0; axis < cameraScales.length; axis++)
    if (!(cameraScales[axis]! > 0) || !Number.isFinite(cameraScales[axis]))
      throw new Error(
        "camera-feasible: matching positive original scales required",
      );
  for (let point: number = 0; point < pointScales.length; point++) {
    const row: readonly number[] | undefined = pointScales[point];
    if (row?.length !== 3)
      throw new Error(
        "camera-feasible: matching positive original scales required",
      );
    for (let axis: number = 0; axis < 3; axis++)
      if (!(row[axis]! > 0) || !Number.isFinite(row[axis]))
        throw new Error(
          "camera-feasible: matching positive original scales required",
        );
  }
}
