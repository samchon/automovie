import type { IAutoMovieConstructionPortField } from "./IAutoMovieConstructionPortField";

/**
 * The existing radial port chart and angle/length clock correspondence.
 *
 * @evidence contracts/development/design.md#principled-representation Extracts the actual operator's mixed mm/radian chart and admitted monotone clock rules without changing their geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface PortRealize, SplitBand and native shared-root construction consume the same chart and correspondence.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No nearest fitting, new inverse, frame replacement or anatomical interpretation is added.
 * @evidence contracts/development/common.md#meaningful-documentation The chart input uses public metres/radians while emitted stations and surface points use kernel mm.
 */
export namespace IAutoMovieConstructionPortCurve {
  /**
   * A port curve as one continuous owner of the shared boundary: its chart point at every clock with two derivatives, the band's inward
   * chart direction with two derivatives, the clock of a chart point's radial foot and the inside test, besides the columns' own
   * addresses and directions (`chart`).
   *
   * @evidence contracts/development/design.md#principled-representation The port curve is the polar curve `centre + r(c) (a cos c, sense b sin c)` in the host chart with `r` the periodic cubic through the loop's shares, so the host's trim, the band's start edge and the crossing between them read one curve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The readers every consumer of the boundary needs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second interpolation of the boundary exists: the columns are this curve's samples.
   * @evidence contracts/development/common.md#meaningful-documentation States each reader's chart and units.
   */
  export interface ICurve {
    /** The columns' chart points, mm and radians: `AutoMovieConstructionPortAddress` at each clock with its share. */
    addresses: [number, number][];

    /** The columns' inward chart directions, the ellipse's at each clock. */
    inward: [number, number][];

    /** Station bounds of the whole curve, mm. */
    reach: [number, number];

    /** The ellipse's station semi-axis, mm: the largest station component of the inward direction. */
    semi: number;

    /** The share field `r`. */
    share: IAutoMovieConstructionPortField.IField;

    /**
     * The curve's chart point at a clock with its first and second clock derivatives.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the three results and their units.
     */
    at: (psi: number) => { point: [number, number]; first: [number, number]; second: [number, number] };

    /**
     * The band's inward chart direction at a clock, `(-a cos c, -sense b sin c)`, with its first and second clock derivatives.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the direction and its derivatives.
     */
    direction: (psi: number) => { d: [number, number]; first: [number, number]; second: [number, number] };

    /**
     * The clock of a chart point's foot on the curve along the ray from the centre, in `[0, 2 pi)`: the correspondence across the seam.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the foot and the range.
     */
    clock: (u: number, v: number) => number;

    /**
     * Whether a chart point lies strictly inside the curve, on the side the host removes.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the strict inequality.
     */
    inside: (u: number, v: number) => boolean;
  }
}
