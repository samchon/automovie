import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

/**
 * Validate owned sparse physical-row metadata before optional arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation A finite affine covector has matching coefficient/index counts, increasing unique physical axes in range, finite coefficients and a finite offset. Offset sign is preserved for its owner rather than reinterpreted by a linear metric action.
 * @evidence contracts/common.md#clear-and-simple-design Optional factor formation validates all fixed rows before arithmetic refusal can hide an ownership defect; a triangular action validates just its supplied sparse row, without rescanning factors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed IDs, missing values, duplicate axes or nonfinite input are core exceptions, never nullable arithmetic support or silently overwritten coordinates.
 * @evidence contracts/common.md#meaningful-documentation Borrows one row and positive physical width, returning no allocation or transformed row. Valid finite inputs may still overflow later numerical actions.
 * @evidence contracts/performance.md#efficient-algorithms One O(Zrow) pass with fewer than16 fixed/scalar visits per entry fits the optional polynomial reserve; ordinary callers include it in their conservative current-model whitening scan. No factor/scale traversal occurs per row.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validation depends on the borrowed current row and is not cached across models or mutable callers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only scalar indices live during the call; no borrowed object, numeric copy or external resource transfers.
 */
export function validateRecoveryMapMetricRow(
  row: IAutoMovieSimplexAtom,
  width: number,
): void {
  if (
    !Number.isSafeInteger(width) ||
    width < 1 ||
    row.indices.length !== row.values.length ||
    !Number.isFinite(row.offset)
  )
    throw new Error(
      "camera-feasible: matching finite metric row ownership required",
    );
  for (let at: number = 0; at < row.indices.length; at++) {
    const axis: number = row.indices[at]!;
    if (
      !Number.isSafeInteger(axis) ||
      axis < 0 ||
      axis >= width ||
      (at > 0 && axis <= row.indices[at - 1]!) ||
      !Number.isFinite(row.values[at])
    )
      throw new Error(
        "camera-feasible: ordered finite physical metric row required",
      );
  }
}
