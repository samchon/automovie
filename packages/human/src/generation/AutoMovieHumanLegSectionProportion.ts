/**
 * The leg section's breadth over depth and its fullness in its box along the
 * leg, from the ankle (share 0) to the crotch (share 1): the width-to-depth
 * law for the leg's tape sites, which publish a girth and no breadth or depth
 * (the thigh's depth aside, `AutoMovieHumanLegSites.thighDepth`).
 *
 * Estimated from the private reference set; no published source found. The
 * reading `test_human_estimate_leg_sections` aggregates eight legs (both legs
 * of f1, f2, m1 and m2) on their horizontal sections at each twentieth of the
 * span between the reference curves' ankle and crotch cuts: the section's
 * breadth over depth and its girth's place in its box range, 0 the rhombus
 * `2 sqrt(W^2 + D^2)` and 1 the box `2 (W + D)` ({@link ROWS}, means; the
 * SDs run 0.009 to 0.043 for the ratio and 0.002 to 0.028 for the fullness).
 * With a girth G, the box's breadth W and depth D follow from the ratio
 * `r = W / D` and the fullness `f`: `G = 2 D (sqrt(r^2 + 1) + f (r + 1 -
 * sqrt(r^2 + 1)))`.
 *
 * Limits: four people; the sections are horizontal, standing for the
 * section normal to the near-vertical leg; the replacement stays open.
 */
export namespace AutoMovieHumanLegSectionProportion {
  /** One share's breadth over depth and fullness, means over the eight legs. */
  export interface IRow {
    /** Share of the ankle-to-crotch span. */
    share: number;

    /** Breadth (lateral) over depth (front to back). */
    ratio: number;

    /** The girth's place in its box range, 0 the rhombus, 1 the box. */
    fullness: number;
  }

  /** The rows, ankle to crotch. */
  export const ROWS: readonly IRow[] = [
    { share: 0.05, ratio: 0.812, fullness: 0.266 },
    { share: 0.1, ratio: 0.914, fullness: 0.256 },
    { share: 0.15, ratio: 0.956, fullness: 0.256 },
    { share: 0.2, ratio: 0.977, fullness: 0.252 },
    { share: 0.25, ratio: 0.996, fullness: 0.259 },
    { share: 0.3, ratio: 0.983, fullness: 0.255 },
    { share: 0.35, ratio: 0.962, fullness: 0.257 },
    { share: 0.4, ratio: 0.944, fullness: 0.264 },
    { share: 0.45, ratio: 0.925, fullness: 0.246 },
    { share: 0.5, ratio: 0.915, fullness: 0.223 },
    { share: 0.55, ratio: 0.934, fullness: 0.21 },
    { share: 0.6, ratio: 0.941, fullness: 0.236 },
    { share: 0.65, ratio: 0.918, fullness: 0.271 },
    { share: 0.7, ratio: 0.903, fullness: 0.281 },
    { share: 0.75, ratio: 0.897, fullness: 0.271 },
    { share: 0.8, ratio: 0.918, fullness: 0.26 },
    { share: 0.85, ratio: 0.945, fullness: 0.262 },
    { share: 0.9, ratio: 0.959, fullness: 0.271 },
    { share: 0.95, ratio: 0.942, fullness: 0.272 },
  ];

  /**
   * The ratio and fullness at a share, linear between the rows and held
   * beyond the ends.
   *
   * @param share Share of the ankle-to-crotch span, 0 to 1.
   */
  export function at(share: number): { ratio: number; fullness: number } {
    const first: IRow = ROWS[0]!;
    const last: IRow = ROWS[ROWS.length - 1]!;
    if (share <= first.share)
      return { ratio: first.ratio, fullness: first.fullness };
    if (share >= last.share)
      return { ratio: last.ratio, fullness: last.fullness };
    let i: number = 0;
    while (ROWS[i + 1]!.share < share) i++;
    const a: IRow = ROWS[i]!;
    const b: IRow = ROWS[i + 1]!;
    const t: number = (share - a.share) / (b.share - a.share);
    return {
      ratio: a.ratio + t * (b.ratio - a.ratio),
      fullness: a.fullness + t * (b.fullness - a.fullness),
    };
  }

  /**
   * The breadth and depth of a section of girth G at a share.
   *
   * @param girth The section's taut-tape girth, mm.
   * @param share Share of the ankle-to-crotch span.
   * @returns Breadth and depth, mm.
   */
  export function box(
    girth: number,
    share: number,
  ): { breadth: number; depth: number } {
    const { ratio, fullness } = at(share);
    const diagonal: number = Math.sqrt(ratio * ratio + 1);
    const depth: number =
      girth / (2 * (diagonal + fullness * (ratio + 1 - diagonal)));
    return { breadth: ratio * depth, depth };
  }
}
