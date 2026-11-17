/**
 * A relief: a feature written as a height over its base chain's surface,
 * such as the nose over the face or a breast over the thorax.
 *
 * Over a window of the base's chart (station and phase), the skin is the
 * base point moved along the relief's fixed `axis` by a height `d(s, t)`, a
 * tensor-product uniform cubic B-spline whose three outer rings of
 * control points are zero (a uniform cubic takes three control points at a
 * knot, so the height, its slope and its curvature then vanish there). `d`
 * and its first and second derivatives therefore vanish at the window's
 * edge, so the skin is as smooth across the edge as
 * the base itself and no boundary exists. A fixed axis chosen across the
 * feature's underside (forward and down for the nose and the breasts)
 * keeps every point a single height, so the feature cannot fold back.
 *
 * The window and the control net are the relief's transformation handles: a
 * gain on the net changes the feature's projection, a change of window its
 * extent.
 *
 * @evidence contracts/development/design.md#principled-representation A feature is a height over a window of its host's chart, so it is carried by the host's surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record of window, profile and axes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The window bounds the feature exactly; nothing leaks outside it.
 * @evidence contracts/development/common.md#meaningful-documentation States each field and its unit.
 */
export interface IAutoMovieLoftRelief {
  /** Name, for diagnostics and part ids. */
  name: string;

  /** Station range of the window on the base chain, mm. */
  stations: [number, number];

  /**
   * Phase range of the window on the base chain, radians, from the first
   * to the second going in increasing phase (it may wrap past 2 pi).
   */
  phases: [number, number];

  /** Unit world direction the height moves the base point along. */
  axis: [number, number, number];

  /**
   * A second unit world direction, square to `axis`, that makes the height's
   * direction turn with the phase instead of staying fixed: at phase `t` it
   * is `cos(t - c) axis + sin(t - c) turn`, `c` the window's middle phase.
   * With `axis` the radial direction of the base's chart at `c` and `turn`
   * the chart's direction of increasing phase there, the height is cast
   * square to a round base all the way round, so one window can go round a
   * part whose sides a fixed axis would only graze. Absent, the axis is fixed.
   */
  turn?: [number, number, number];

  /** Number of control points across the station range, at least 7. */
  rows: number;

  /** Number of control points across the phase range, at least 7. */
  columns: number;

  /**
   * Heights of the control points in mm, row by row from the window's
   * lowest station, `rows * columns` values; the three outer rings are zero.
   */
  heights: number[];

  /**
   * The lips' station map `D` (the redesign plan's section 2): control
   * values in mm of station over the same net as `heights`, its three outer
   * rings zero, so the relief reads its height field at station
   * `s + D(s, t)` and the vermilion borders move without the cutaneous lips.
   * Absent means no map.
   */
  shift?: number[];
}
