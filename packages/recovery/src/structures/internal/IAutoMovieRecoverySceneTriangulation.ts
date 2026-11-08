/**
 * A candidate original-design point, withheld on any geometry refusal.
 *
 * @evidence contracts/development/design.md#principled-representation A finite common-gauge point is distinct from rank, ray/depth or pixel refusal reasons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named internal result separates point construction from committing a scene transaction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A null point is never replaced by a clamped or guessed coordinate.
 * @evidence contracts/development/common.md#meaningful-documentation Members define finite qualified point ownership and null/refusal meaning.
 */
export interface IAutoMovieRecoverySceneTriangulation {
  /** Qualified point in common seed-baseline units, null on refusal. */
  point: [number, number, number] | null;

  /** Available reasons for withholding the candidate. */
  reasons: string[];
}
