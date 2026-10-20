/**
 * A candidate original-design point, withheld on any geometry refusal.
 *
 * @evidence contracts/common.md#principled-implementation A finite common-gauge point is distinct from rank, ray/depth or pixel refusal reasons.
 * @evidence contracts/common.md#clear-and-simple-design One named internal result separates point construction from committing a scene transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null point is never replaced by a clamped or guessed coordinate.
 * @evidence contracts/common.md#meaningful-documentation Members define finite qualified point ownership and null/refusal meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no triangulation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns a small numeric result without resources.
 */
export interface IAutoMovieRecoverySceneTriangulation {
  /** Qualified point in common seed-baseline units, null on refusal. */
  point: [number, number, number] | null;

  /** Available reasons for withholding the candidate. */
  reasons: string[];
}
