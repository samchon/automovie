/**
 * Estimates numerical column rank by twice-reorthogonalized Gram-Schmidt.
 * Input columns must already be comparably scaled. The absolute residual norm
 * cutoff is a declared numerical convention, not a population-identifiability
 * certificate or a condition-number estimate. Column order can affect decisions
 * close to the cutoff; singular values remain a separate research diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Reorthogonalizes each finite equal-length column twice against the accepted orthonormal basis and admits a direction only above the explicit residual norm cutoff.
 * @evidence contracts/common.md#clear-and-simple-design Returns rank only; measurement normalization, missing-value policy and identity reservation belong to the study operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no expected rank, identity-specific adjustment or regularization that could conceal absent directions.
 * @evidence contracts/common.md#meaningful-documentation States scaling, numerical threshold, order sensitivity and the absence of a condition or population certificate.
 * @evidence contracts/performance.md#efficient-algorithms For n observations, p columns and rank r, two projection passes cost O(npr) and retain O(nr) basis values plus one O(n) working column.
 * @evidence contracts/performance.md#reuse-equivalent-work The basis is shared across columns during one calculation; no cross-call state or input cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The working column and basis are local arrays bounded by input dimensions and released to garbage collection on return or failure; no handles are acquired.
 */
export function calibrationRank(columns: number[][], cutoff: number): number {
  if (!Number.isFinite(cutoff) || cutoff <= 0)
    throw new Error("Rank cutoff must be positive and finite");
  const count: number = columns[0]?.length ?? 0;
  const basis: number[][] = [];
  for (const column of columns) {
    if (
      column.length !== count ||
      column.some((value: number): boolean => !Number.isFinite(value))
    )
      throw new Error("Rank columns must have equal length and finite values");
    const residual: number[] = column.slice();
    for (let pass: number = 0; pass < 2; pass++)
      for (const direction of basis) {
        let projection: number = 0;
        for (let index: number = 0; index < count; index++)
          projection += residual[index]! * direction[index]!;
        for (let index: number = 0; index < count; index++)
          residual[index] = residual[index]! - projection * direction[index]!;
      }
    const norm: number = Math.hypot(...residual);
    if (norm > cutoff)
      basis.push(residual.map((value: number): number => value / norm));
  }
  return basis.length;
}
