/** A candidate original-design point, withheld on any geometry refusal. */
export interface IAutoMovieRecoverySceneTriangulation {
  /** Qualified point in common seed-baseline units, null on refusal. */
  point: [number, number, number] | null;

  /** Available reasons for withholding the candidate. */
  reasons: string[];
}
