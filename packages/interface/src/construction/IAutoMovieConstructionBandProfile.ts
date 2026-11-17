/**
 * One cross profile of a port's band: a depth along the band's own inward normal over a window of its loop clock.
 *
 * At an interior section of clock `c` and cross share `t` (0 at the port curve, 1 at the part's rail) the supplied point is the plain blend's, carried in
 * by `w(c) D(t)` along the plain blend's inward unit normal there. `D` is the cubic spline through `(0, 0)`, the knots and `(1, 0)` with
 * zero slope at both ends, so the depth starts and ends flat; it is laid in as interior cross sections at the knots' shares, each with the
 * depth's own slope and bend across the band, and the band's rails keep the two sides' 2-jets, so it stays G2 to the host and to the part.
 * `w` is 1 inside `[start, end]` and falls to 0 over `transition` on each side by the quintic smoothstep, as a split's crease window does,
 * so the band stays C2 along its loop. Where windows overlap their depths add; every window's knots are laid at every window's shares.
 * The section derivative construction omits the inward normal's own derivatives across the band. The resulting piecewise quintic passes through those supplied section jets and keeps the original rail jets; it is not the exact normal-displaced plain surface between sections. Port realization converts metre depths to IAutoMovieConstructionBandProfile64 millimetres once before this kernel evaluation.
 *
 * Engine admission: at least one knot; every share finite in `(0, 1)` and above the one before it; every depth finite; `start` and `end`
 * finite with `start <= end < start + 2 pi`; `transition` finite and positive.
 *
 * @evidence contracts/development/design.md#principled-representation A profile blend shapes its interior by cross sections between rails it keeps (Alias's profile blend; Elber's rail-based cross sections); the band is already the quintic Hermite of its two rails' 2-jets, so a depth with flat ends laid in as interior sections keeps both rails' continuity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A knot list and a clock window with its transition, the crease window's own fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored knots and window only; nothing is fitted or searched in the engine.
 * @evidence contracts/development/common.md#meaningful-documentation States the share, the normal, the depth law, the window law, the continuity it keeps and the admission rules, in metres and radians.
 */
export interface IAutoMovieConstructionBandProfile {
  /** Interior knots `[t, depth]`: `t` the cross share in `(0, 1)`, increasing; `depth` metres along the band's inward normal. */
  knots: [number, number][];

  /** The window's first clock, radians on the band's loop clock. */
  start: number;

  /** The window's last clock, radians, `start <= end < start + 2 pi` (a window may run past `2 pi` and wrap). */
  end: number;

  /** The fall from the whole depth to none on each side of the window, radians of clock, positive. */
  transition: number;
}
