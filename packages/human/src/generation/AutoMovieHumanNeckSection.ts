/**
 * The neck's box at its tape site, the girth just below the larynx (ANSUR II
 * `neckcircumference`, the Human's `neckCircumference`): its breadth and depth
 * from the girth, which the surveys take without a breadth or depth there.
 *
 * Estimated from the private reference set; no published source found. The
 * reading `test_human_estimate_sites` takes, on four people, the section of
 * least taut girth between the neck's lowest skin above cervicale's height
 * and the menton: breadth over depth {@link BREADTH_OVER_DEPTH} (SD 0.104)
 * and fullness in its box {@link FULLNESS} (SD 0.043; 0 the rhombus, 1 the
 * box, `AutoMovieHumanBodyBox`).
 *
 * The box follows from the girth G with breadth W = rD and fullness f, since
 * a convex section's taut girth runs from the rhombus 2 sqrt(W^2 + D^2) to the
 * box 2(W + D): G = D (2 sqrt(r^2 + 1) (1 - f) + 2 f (1 + r)).
 *
 * Limits: four people; the replacement stays open.
 */
export namespace AutoMovieHumanNeckSection {
  /** Breadth over depth at the least girth. */
  export const BREADTH_OVER_DEPTH: number = 0.983;

  /** Fullness in the box at the least girth. */
  export const FULLNESS: number = 0.245;

  /**
   * The neck's box at its tape site.
   *
   * @param girth Neck circumference, mm.
   * @returns Breadth (side to side) and depth (front to back), mm.
   */
  export function box(girth: number): { breadth: number; depth: number } {
    const r: number = BREADTH_OVER_DEPTH;
    const f: number = FULLNESS;
    const depth: number = girth / (2 * Math.sqrt(r * r + 1) * (1 - f) + 2 * f * (1 + r));
    return { breadth: r * depth, depth };
  }
}
