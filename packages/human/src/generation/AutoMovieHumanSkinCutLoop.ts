/**
 * A join's loop as a face's skin cut by a declared surface: the shares of a port loop (`IAutoMovieConstructionPort.ILoop.shape`) at
 * which the skin, followed outward from the loop's centre along each column's ray of the chart, crosses the surface.
 *
 * The surface is a signed measure of a point, negative on the part's side and zero on the surface, fixed in a frame of the skeleton
 * (a plane, a cylinder about an axis, a wedge about a line), so the loop follows the person and the pose and is never a table read off
 * one figure (`.agents/skills/human/construction.md`, Ports). The loop it gives is star-shaped about the centre by construction: one
 * crossing a ray, the first from the centre.
 */
export namespace AutoMovieHumanSkinCutLoop {
  /** A point, mm. */
  export type V3 = [number, number, number];

  /** What the cut is read from. */
  export interface IInput {
    /** The face's skin at a chart point. */
    point: (u: number, v: number) => V3;

    /** The loop's centre on the chart, on the part's side of the surface. */
    centre: [number, number];

    /** The ellipse the shares scale, in the chart's own units, positive. */
    semi: [number, number];

    /** +1 or -1: the second chart coordinate's sense of increasing clock, as the loop's. */
    sense: 1 | -1;

    /** Columns: the shares are read at the clocks `2 pi k / count`. */
    count: number;

    /** The surface: negative on the part's side, zero on it. */
    side: (p: V3) => number;

    /** The largest share a crossing is sought at. */
    reach: number;
  }

  /*
   * Steps a ray is walked in before the crossing is bracketed.
   */
  const STEPS: number = 256;

  /**
   * The loop's shares, or the premise that failed: the centre not on the part's side, or a ray that does not cross the surface within
   * reach, named by its clock.
   *
   * Each ray is walked outward in `STEPS` equal steps to the first change of sign and the crossing is closed in by bisection to the
   * rounding of the share, so a share is the first crossing from the centre and nothing is interpolated between columns.
   */
  export function shares(input: IInput): number[] | string {
    const value = (clock: number, share: number): number =>
      input.side(input.point(input.centre[0] + share * input.semi[0] * Math.cos(clock), input.centre[1] + share * input.sense * input.semi[1] * Math.sin(clock)));
    if (!(value(0, 0) < 0)) return "the loop's centre does not stand on the part's side of the surface";
    const out: number[] = [];
    for (let k: number = 0; k < input.count; ++k) {
      const clock: number = (2 * Math.PI * k) / input.count;
      let inside: number = 0;
      let outside: number = NaN;
      for (let step: number = 1; step <= STEPS; ++step) {
        const share: number = (input.reach * step) / STEPS;
        if (value(clock, share) < 0) inside = share;
        else {
          outside = share;
          break;
        }
      }
      if (Number.isNaN(outside)) return `the ray at clock ${clock} does not cross the surface within the share ${input.reach}`;
      for (let turn: number = 0; turn < 60 && outside - inside > Number.EPSILON * Math.max(1, outside); ++turn) {
        const middle: number = (inside + outside) / 2;
        if (value(clock, middle) < 0) inside = middle;
        else outside = middle;
      }
      out.push((inside + outside) / 2);
    }
    return out;
  }
}
