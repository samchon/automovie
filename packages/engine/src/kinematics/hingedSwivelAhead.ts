/**
 * Compare actual hinged swivel candidates under the articulation's existing
 * legality, deferred deviation and optional second-key policy. Zero legality
 * remains exact; only two positive overshoots within 1e-9 degree tie. A lazy
 * deviation is a certified lower bound, so an already decisive bound can spare
 * the other candidate's exact objective. Exact and second-key readers retain
 * their completed value on the same candidate record. With a tie width, two
 * deviations are one when they fall in the same bucket of that width (`rank`),
 * and the second key decides between them: the comparison is then a total
 * preorder, so the first of equals a fold keeps does not depend on which pairs
 * happened to be compared. A fixed positive excess may vary only in clinical
 * decomposition's last digits across swivels. Ranking those digits once
 * separated mirrored poses by fourteen degrees; the existing positive-only band
 * prevents that while keeping every legal zero ahead of even a tiny actual
 * violation.
 *
 * @param a Candidate proposed ahead of b, with a pure unchanged objective.
 * @param b Existing candidate under the same score and target.
 * @param tie Positive width of the deviation's buckets, its own unit; omitted,
 *   compare deviations strictly.
 * @returns Whether a is strictly ahead; complete ties retain b.
 */
export function hingedSwivelAhead(a: IScore, b: IScore, tie?: number): boolean {
  const tied: boolean =
    a.overshoot === b.overshoot ||
    (a.overshoot > 0 &&
      b.overshoot > 0 &&
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
  const theirs: number = hingedSwivelAhead.rank(
    hingedSwivelAhead.exact(b),
    tie,
  );
  if (
    a.exact !== undefined &&
    hingedSwivelAhead.rank(a.deviation, tie) > theirs
  )
    return false;
  const mine: number = hingedSwivelAhead.rank(hingedSwivelAhead.exact(a), tie);
  if (mine !== theirs) return mine < theirs;
  return hingedSwivelAhead.second(a) < hingedSwivelAhead.second(b);
}

/** Shared reads of a candidate's actual deferred objective and second key. */
export namespace hingedSwivelAhead {
  /**
   * Read the exact deviation once, or the already exact deviation without a
   * callback.
   */
  export function exact(scored: IScore): number {
    if (scored.exact === undefined) return scored.deviation;
    if (scored.known === undefined) scored.known = scored.exact();
    return scored.known;
  }

  /**
   * The bucket of a deviation under a tie width: `floor(deviation / tie)`, the
   * quantisation `fitChainBend` ranks its residuals by. Monotone, so a lower
   * bound's bucket is at most its exact value's.
   */
  export function rank(deviation: number, tie: number): number {
    return Math.floor(deviation / tie);
  }

  /**
   * Read the actual second key once; an absent reader means the original zero
   * key.
   */
  export function second(scored: IScore): number {
    if (scored.tiebreak === undefined) return 0;
    if (scored.second === undefined) scored.second = scored.tiebreak();
    return scored.second;
  }
}

/**
 * Scalar score state supplied and retained by the articulation's bounded
 * search.
 */
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
