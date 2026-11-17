/**
 * Lexicographic quality of one selected hinged-chain candidate.
 *
 * fitHingedChainCandidate produces the score carried through solved plants and
 * seeded fits. Zero overshoot precedes every positive overshoot; error then
 * compares legal candidates and strain breaks the remaining tie. This record
 * reports the selected candidate and does not certify reach or contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the score order, angular units, reference-pose replacement and limits of the result.
 * @evidence contracts/development/design.md#principled-representation Overshoot and error use degrees, while strain uses the caller's objective units or the explicitly weighted reference-pose departure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded fits and solved plants carry the same producer-owned score rather than redeclaring its three fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A returned least-overshoot candidate can remain illegal; the score does not manufacture a successful feasibility verdict.
 */
export interface IAutoMovieChainFitScore {
  /** Joint ROM excess plus caller obstruction penalty on the degree scale; zero means no scored violation. */
  overshoot: number;

  /** Selected effector orientation mismatch in degrees. */
  error: number;

  /** Caller strain units without referencePose; otherwise referenceWeight times summed upper/lower rotation departure in degrees replaces the callback score. */
  strain: number;
}
