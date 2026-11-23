/**
 * Lexicographic quality of one selected hinged-chain candidate.
 *
 * FitHingedChainCandidate produces the score carried through solved plants and
 * seeded fits. Zero overshoot precedes every positive overshoot; error then
 * compares legal candidates and strain breaks the remaining tie. This record
 * reports the selected candidate and does not certify reach or contact.
 */
export interface IAutoMovieChainFitScore {
  /**
   * Joint ROM excess plus caller obstruction penalty on the degree scale; zero
   * means no scored violation.
   */
  overshoot: number;

  /** Selected effector orientation mismatch in degrees. */
  error: number;

  /**
   * Caller strain units without referencePose; otherwise referenceWeight times
   * summed upper/lower rotation departure in degrees replaces the callback
   * score.
   */
  strain: number;
}
