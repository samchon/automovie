/**
 * Compare actual hinged swivel candidates under the articulation's existing
 * legality, deferred deviation and optional second-key policy. Zero legality
 * remains exact; only two positive overshoots within 1e-9 degree tie. A lazy
 * deviation is a certified lower bound, so an already decisive bound can
 * spare the other candidate's exact objective. Exact and second-key readers
 * retain their completed value on the same candidate record.
 * With a tie width, two deviations are one when they fall in the same bucket
 * of that width (`rank`), and the second key decides between them: the
 * comparison is then a total preorder, so the first of equals a fold keeps
 * does not depend on which pairs happened to be compared.
 * A fixed positive excess may vary only in clinical decomposition's last
 * digits across swivels. Ranking those digits once separated mirrored poses
 * by fourteen degrees; the existing positive-only band prevents that while
 * keeping every legal zero ahead of even a tiny actual violation.
 *
 * @param a Candidate proposed ahead of b, with a pure unchanged objective.
 * @param b Existing candidate under the same score and target.
 * @param tie Positive width of the deviation's buckets, its own unit; omitted, compare deviations strictly.
 * @returns Whether a is strictly ahead; complete ties retain b.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States exact zero legality, positive overshoot rounding, bound premise, strict ties and the same-record lifetime of exact/second readers.
 * @evidence contracts/development/implementation.md#principled-implementation Lexicographic legality precedes deviation, with the existing positive-only 1e-9 degree tie and caller tie/second policy. A tie width quantises the deviation into buckets (task priority's "among the first objective's optima", Siciliano and Slotine 1991, made a transitive relation). A bound cannot exceed its exact score nor its bucket the exact one's; when a's exact bucket is already below b's bound's, b cannot win and needs no exact query.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparator owns the same policy for sweep and golden refinement; exact and second are the single owners of lazy per-candidate reads, including final returned values.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves exact-zero legality, all original strict comparisons without a width and earlier-candidate ties. The buckets use the caller's own width; no new cost, threshold, candidate or approximate certificate is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each comparison performs constant scalar work plus only the deferred objective reads its bounds cannot decide. Each candidate's exact and second callback runs at most once; no search or candidate sampling is changed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A completed pure exact or second reading belongs to this immutable candidate under the unchanged synchronous score/target. It is shared by comparisons and final result reporting; no reading crosses candidates or solves.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This helper owns no collection or handle. Two optional scalar readings remain on caller-owned bounded candidate records until their search releases them, including on throw.
 */
export function hingedSwivelAhead(a: IScore, b: IScore, tie?: number): boolean {
  const tied: boolean = a.overshoot === b.overshoot ||
    (a.overshoot > 0 && b.overshoot > 0 &&
      Math.abs(a.overshoot - b.overshoot) <= OVERSHOOT_ROUNDING);
  if (!tied) return a.overshoot < b.overshoot;
  if (tie === undefined) {
    if (a.deviation < b.deviation && hingedSwivelAhead.exact(a) < b.deviation)
      return true;
    const theirs: number = hingedSwivelAhead.exact(b);
    if (a.exact !== undefined && a.deviation >= theirs) return false;
    return hingedSwivelAhead.exact(a) < theirs;
  }

  // With a tie width the deviation is compared by its bucket of that width,
  // which is a total preorder: a band around each pair (`|a - b| <= tie`) is
  // not transitive, so the candidate a fold kept depended on the order the
  // candidates were met in. A bound's bucket never exceeds its exact value's.
  if (
    a.deviation < b.deviation &&
    hingedSwivelAhead.rank(hingedSwivelAhead.exact(a), tie) <
      hingedSwivelAhead.rank(b.deviation, tie)
  )
    return true;
  const theirs: number = hingedSwivelAhead.rank(hingedSwivelAhead.exact(b), tie);
  if (a.exact !== undefined && hingedSwivelAhead.rank(a.deviation, tie) > theirs)
    return false;
  const mine: number = hingedSwivelAhead.rank(hingedSwivelAhead.exact(a), tie);
  if (mine !== theirs) return mine < theirs;
  return hingedSwivelAhead.second(a) < hingedSwivelAhead.second(b);
}

/**
 * Shared reads of a candidate's actual deferred objective and second key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the exact and second readers, absent-callback fallbacks and candidate-local scalar retention.
 * @evidence contracts/development/design.md#principled-representation Both readers use the same scored record the comparator ranks; known and second hold only actual completed scalar values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The articulation uses these readers for its first-candidate bound certificate and final actual result; no unrelated optimizer API or root-barrel export is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No approximate cost or target history is stored, and complete ties still follow the comparator's existing strict policy.
 */
export namespace hingedSwivelAhead {
  /** Read the exact deviation once, or the already exact deviation without a callback. */
  export function exact(scored: IScore): number {
    if (scored.exact === undefined) return scored.deviation;
    if (scored.known === undefined) scored.known = scored.exact();
    return scored.known;
  }

  /**
   * The bucket of a deviation under a tie width: `floor(deviation / tie)`,
   * the quantisation `fitChainBend` ranks its residuals by. Monotone, so a
   * lower bound's bucket is at most its exact value's.
   */
  export function rank(deviation: number, tie: number): number {
    return Math.floor(deviation / tie);
  }

  /** Read the actual second key once; an absent reader means the original zero key. */
  export function second(scored: IScore): number {
    if (scored.tiebreak === undefined) return 0;
    if (scored.second === undefined) scored.second = scored.tiebreak();
    return scored.second;
  }
}

/** Scalar score state supplied and retained by the articulation's bounded search. */
interface IScore {
  /** Actual legality excess in degrees, compared first. */
  overshoot: number;
  /** Actual deviation, or its certified lower bound when exact is supplied. */
  deviation: number;
  /** Pure exact deviation under this candidate's unchanged objective. */
  exact?: () => number;
  /** Completed actual exact reading. */
  known?: number;
  /** Pure optional second key under the same unchanged objective. */
  tiebreak?: () => number;
  /** Completed actual second key. */
  second?: number;
}

/** Existing positive-overshoot chart rounding, degrees; zero never uses a band. */
const OVERSHOOT_ROUNDING: number = 1e-9;
