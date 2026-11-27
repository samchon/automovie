/**
 * Where a closed end's dome begins: the station at which the stretch left before the pole is a stated share of the section's own reach
 * there.
 *
 * A digit's end is a dome whose length follows its thickness, not a fixed number of millimetres. A family's cap law
 * (`AutoMovieHumanConicLoft.ITip`) draws a half ellipsoid from the section at `from` to the pole when it leaves the wall with the wall's
 * slope and bend, so the dome's proportion is set by one thing alone: how far before the pole the cap starts against how thick the part
 * is there. Read on f1's reference by `test/src/reference-conics/FamilyConicBodyParts.ts` (each end's sections fitted by
 * `r(d) = R sqrt(1 - (1 - d / H)^2)`), a finger's end is a half ellipsoid 1.36 to 1.78 reaches long, the thumb's 1.09, a toe's 0.73 to
 * 1.08; caps started a fixed 3.1 to 3.9 mm before the pole drew the fingers' at 0.48 to 0.76 of a reach, blunter than the reference.
 *
 * The share is a prior of the kind of digit in its own normalised coordinate (length over reach), so it holds for a thicker or a thinner
 * digit; the pole and the reach are the person's.
 */
export namespace AutoMovieHumanTipDome {
  /** Where a dome begins. */
  export interface IStart {
    /** The station the cap starts at, mm. */
    from: number;

    /**
     * Whether the dome was held at the earliest station it may start from: the part is shorter there than its dome's proportion asks,
     * and the cap then starts at `least` with a shorter dome than the share's.
     */
    held: boolean;
  }

  /**
   * The station `from` with `pole - from = share x reach(from)`, between `least` and the pole.
   *
   * @param reach The section's mean reach by station, mm: positive and continuous from `least` to `pole`.
   * @param pole The pole's station, mm.
   * @param share The dome's length over the reach of the section it starts from.
   * @param least The earliest station the cap may start from, mm, such as the family's second knot.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Bisection on `g(s) = pole - s - share reach(s)`, which is negative at the pole (a positive reach) and, where the part is long enough, positive at `least`; halving finds a sign change between them, the only one wherever the reach grows toward the pole by less than `1 / share` a millimetre (it shrinks toward a digit's end). Premise: `reach` is continuous, as a family's field readers are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bracket and one loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A part too short for its dome is reported by `held`, not hidden; a nonpositive share or reach and a pole at or before `least` are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the equation solved, the units and what `held` means.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HALVINGS` reads of the reach.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure solve coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function start(reach: (station: number) => number, pole: number, share: number, least: number): IStart {
    if (!(Number.isFinite(share) && share > 0)) throw new Error("tip dome: the share must be finite and positive");
    if (!(pole > least)) throw new Error("tip dome: the pole must lie past the earliest start");
    const gap = (station: number): number => {
      const r: number = reach(station);
      if (!(Number.isFinite(r) && r > 0)) throw new Error("tip dome: the reach at " + station + " mm is not positive");
      return pole - station - share * r;
    };
    if (gap(least) <= 0) return { from: least, held: true };
    let [low, high]: [number, number] = [least, pole];
    for (let k: number = 0; k < HALVINGS; ++k) {
      const middle: number = (low + high) / 2;
      if (gap(middle) > 0) low = middle;
      else high = middle;
    }
    return { from: (low + high) / 2, held: false };
  }

  /*
   * Halvings of the bracket: sixty take a bracket of a hundred millimetres under one unit of a double.
   */
  const HALVINGS: number = 60;
}
