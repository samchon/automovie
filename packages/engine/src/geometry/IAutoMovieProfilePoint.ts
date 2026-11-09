/**
 * One point of a code-authored 2D construction profile, in metres.
 *
 * The consumer maps the axes: extrusion and region faces place `x` and `y` in
 * local XY with depth along Z, revolution reads `x` as radius and `y` as height
 * around local Y, and sweep and loft read `x` along the path frame's right and
 * `y` along its up. Each builder refuses a non-finite coordinate by the point's
 * label. The shape matches the interface's `IAutoMoviePlanarPoint`, so
 * `autoMoviePlanarRegionFailure` validates profile rings directly.
 *
 * @evidence contracts/development/design.md#principled-representation A plain Cartesian pair whose meaning each builder fixes by its own construction plane, and which `finitePoint` and `autoMoviePlanarRegionFailure` admit before any geometry is emitted.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept as the engine's construction-profile name beside the interface's boundary-face point because a profile lives in a builder's own plane before extrusion or sweep, not in a built boundary's face frame; the identical shape lets shared planar checks take either.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No builder rounds, snaps or reorders profile points; rings are copied as authored and only rewound by the canonical region layout, which keeps each point's source index.
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, how each family of builders maps the two axes, where finiteness is checked, and why planar region validation accepts it.
 */
export interface IAutoMovieProfilePoint {
  /** First profile coordinate in metres, mapped by the consuming builder. */
  x: number;

  /** Second profile coordinate in metres, mapped by the consuming builder. */
  y: number;
}
