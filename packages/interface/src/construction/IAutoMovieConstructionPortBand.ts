import type { IAutoMovieConstructionPortCurve } from "./IAutoMovieConstructionPortCurve";
import type { IAutoMovieConstructionPortField } from "./IAutoMovieConstructionPortField";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A port's band with exact seams (`IAutoMovieConstructionPort`): at every
 * clock, not only at its columns, its start edge is the host's point on the
 * port curve and its end edge the part's point on its rail, and it meets each
 * G2 with the side's own 2-jet across the seam.
 *
 * Method: the band blends two real fields (construction.md, Ports), each side's
 * own surface read past its seam, with the quintic Hermite weights. With `s = u
 * / L` its cross share and `c` its clock,
 *
 * ```text
 * S(s, c) = W(s) A(sigma(s), c) + W(1 - s) B(sigma(1 - s), c),   W(s) = (1 - s)^3 (1 + 3 s + 6 s^2),   sigma(s) = s (1 + 3 s) / (1 + 3 s + 6 s^2)
 * ```
 *
 * `W` and `W(1 - s)` are the quintic Hermite value weights, a partition of
 * unity flat to second order at both ends, and `W sigma` is the Hermite weight
 * of the first derivative, so at a column the band leaves each seam with the
 * same ribbons as the column strip (`AutoMovieSolidBlendChain.strip`). `A(t, c)
 * = H(x(c) + t e(c))` is the host itself, read from the port curve `x(c)` along
 * the band's inward chart direction `e(c) = g(c) d(c)`, inside the curve where
 * the host's surface runs on under the band. `B(t, c)` continues the part
 * across its rail `(rho(chi(c)), chi(c))` toward its end with the part's own
 * 2-jet at the rail, yet reads the part only on its rail and in its kept side:
 * `B = 6 P(r) - 8 P(r + t m / 2) + 3 P(r + t m)`, `m = into g(c)` along the
 * station, whose value, slope and bend in `t` at the rail are those of `P(r - t
 * m)` (`REFLECTED`). A part publishes little or nothing between its end and its
 * rail (a millimetre on a mound), so the band asks for none of it. The blend of
 * two surfaces by a weight flat to order n meets each Gn (E. Hartmann,
 * "Parametric Gn blending of curves and surfaces", The Visual Computer 17,
 * 2001); here the whole 2-jet of `S` at `s = 0` is that of `H(x(c) + s e(c))`,
 * the ribbon composition `AutoMovieSolidRibbon` shows G2 to the host for any
 * smooth direction field, and likewise at `s = 1`. Every derivative of `S` is
 * the chain rule on the two sides' own 2-jets and on the clock fields, so no
 * side's third derivative is needed and none is invented.
 *
 * Why a strip is read and not the 2-jet at each seam alone: a band spanned from
 * the seams' 2-jets (the column strip's ribbons) has its own clock derivatives
 * in the sides' third and fourth derivatives, which a surface's 2-jet does not
 * supply; the column strip avoids them by interpolating the ribbons between
 * columns, which is what leaves its seams inexact there. Reading each side at a
 * distance that shrinks to zero at its seam gives the same 2-jet at the seam
 * and real derivatives everywhere. Each side is read at most `sigma(1) = 0.4`
 * of its ribbon from its seam: the host inside the port curve, the part in its
 * kept side.
 *
 * The clock fields join per-column values by the periodic cubic
 * (`AutoMovieConstructionPortField.periodic`): the port curve's share (in
 * `PortCurve.ICurve`), each side's cross speed `g` (the column's ribbon factor
 * times its chord over the side's speed along the direction, exactly the column
 * strip's ribbon at each column), the part's phase `chi(c) = sense c +
 * delta(c)` through the column correspondence, and a curved rail's station
 * `rho`. No second interpolation of either seam exists: the host's trim reads
 * the same port curve and the part's rail cycle the same `rho`
 * (`IAutoMovieSolidCycle.IExact`).
 *
 * Between its seams the band is not the column strip: the strip spans each
 * side's second-order ribbon, this band each side's surface, and the two differ
 * by the sides' third-order terms over the ribbon, largest near the middle of
 * the span.
 */
export namespace IAutoMovieConstructionPortBand {
  /**
   * The part's side: its surface, its rail station field over its own phase,
   * and its station sign into its kept side.
   */
  export interface ISide {
    /** The part's surface, mm. */
    surface: IAutoMovieSolidSurface;

    /** The rail's station at the part's phase, mm, with two derivatives. */
    rail: IAutoMovieConstructionPortField.IField;

    /** The station's sign into the part's kept side. */
    into: 1 | -1;
  }

  /** What the band is built from: the column strip's own results and both sides. */
  export interface IInput {
    /** The band's face name. */
    name: string;

    /** The host's surface, mm. */
    host: IAutoMovieSolidSurface;

    /** The port curve on the host's chart. */
    curve: IAutoMovieConstructionPortCurve.ICurve;

    /** The part's side. */
    child: ISide;

    /**
     * The part's phase at each column, radians, unwrapped along the clock
     * (`IAutoMovieConstructionSplitBand.IStrip.childPhases`).
     */
    childPhases: readonly number[];

    /**
     * Each column's ribbon factor
     * (`IAutoMovieConstructionSplitBand.IStrip.field`).
     */
    field: readonly number[];

    /**
     * The band's span, mm: its station runs from 0 at the port curve to this at
     * the rail.
     */
    length: number;

    /** The sign that turns `S_u x S_v` outward, the column strip's. */
    orientation: 1 | -1;
  }
}
