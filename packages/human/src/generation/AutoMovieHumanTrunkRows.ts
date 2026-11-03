/**
 * The sampling rule of a trunk chain's layers: where its rows stand between
 * the chain's ends.
 *
 * A row is a layer of the chain's station rule, which is C2 through every
 * row, so the rows only have to be close enough that the rings' shape between
 * them is what the rule's spline gives. Every landmark station between the
 * ends is a row of its own, so each tape's site is a row, and the run between
 * two consecutive kept stations is cut into equal intervals, as few as keep
 * each one no wider than the spacing the caller's rule allows there. So
 * neighbouring rows inside a run are equally spaced, and the spacing changes
 * only at a kept station, by the ratio of the two runs' intervals.
 *
 * Kept stations closer than `MERGE` of the spacing are one row: two landmarks
 * a millimetre apart would otherwise put an interval a fifth of its
 * neighbours' between them, a step the C2 rule prints as a ring.
 *
 * The count is never below the reference's: the four reference bodies' trunk
 * region carries 158 (f1), 151 (f2), 150 (m1) and 171 (m2) sections over 609,
 * 606, 685 and 694 mm (`docs/testing/reference-layer.md`, Counts by region), a
 * mean gap of 3.9, 4.0, 4.6 and 4.1 mm, with up to 100 Hermite spans per loop.
 * The spacing here never exceeds `MAX_GAP`, so the trunk and the shoulders
 * carry at least 175 rows over the same height and 256 controls on every row,
 * 2.5 times the reference's spans per loop.
 */
export namespace AutoMovieHumanTrunkRows {
  /**
   * The widest row spacing, mm: under the smallest mean gap of the four
   * references' trunk sections (f1, 158 sections over 609 mm of the MetaHuman
   * reference asset's trunk region, 3.9 mm). Derived from the reference's
   * density; the rule that places the rows is the spacing function the caller
   * passes.
   */
  export const MAX_GAP: number = 3.5;

  /** Share of the spacing under which two kept stations are one row. */
  export const MERGE: number = 0.4;

  /**
   * The rows of a chain from its first station to its last.
   *
   * @param from The chain's first station, mm.
   * @param to The chain's last station, mm.
   * @param marks Landmark stations to keep, mm, in any order; those outside `(from, to)` are ignored.
   * @param spacing The spacing allowed at a station, mm: the rule of the chain, capped at `MAX_GAP`.
   * @returns Strictly rising stations from `from` to `to`.
   */
  export function stations(
    from: number,
    to: number,
    marks: readonly number[],
    spacing: (y: number) => number,
  ): number[] {
    const gap = (y: number): number => Math.min(MAX_GAP, spacing(y));

    // The kept stations: the ends, and each landmark clear of the last kept one
    // and of the chain's top by the merge share of the spacing.
    const kept: number[] = [from];
    for (const y of [...marks].sort((a: number, b: number): number => a - b)) {
      const last: number = kept[kept.length - 1]!;
      if (y - last > MERGE * gap(last) && to - y > MERGE * gap(y)) kept.push(y);
    }
    kept.push(to);

    // Each run between kept stations in equal intervals no wider than the
    // narrowest spacing the rule allows over it, sampled at its ends and middle.
    const out: number[] = [from];
    for (let k: number = 1; k < kept.length; k++) {
      const a: number = kept[k - 1]!;
      const b: number = kept[k]!;
      const h: number = Math.min(gap(a), gap((a + b) / 2), gap(b));
      const count: number = Math.max(1, Math.ceil((b - a) / h - 1e-9));
      for (let i: number = 1; i <= count; i++) out.push(a + ((b - a) * i) / count);
    }
    return out;
  }
}
