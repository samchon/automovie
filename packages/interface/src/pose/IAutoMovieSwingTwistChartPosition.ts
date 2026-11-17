/**
 * A rotation's place in the range's chart: its swing as a share of the
 * region's radius on its own great circle, laid out on the unit disc by its
 * azimuth (`x`, `y`), and its twist read inside the interval (`twist`). The
 * region is star-shaped about the rest direction with a radius below 180
 * degrees on every great circle (`ISwingTwist.reach`), so the region is the
 * unit disc exactly, the rest direction its centre, and the chart is
 * continuous and one to one over it: the rest direction's antipode, where a
 * direction has no azimuth and a rotation no twist, lies outside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes dimensionless swing-disc coordinates from clinical-degree twist and notes that chart does not clamp.
 * @evidence contracts/development/design.md#principled-representation The legal swing region maps to the unit disc; twist uses the alias nearest the allowed degree interval. An outside rotation can yield coordinates outside these bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface swingTwistRange.chart supplies the coordinates read by placed and blend using the same constraint and joint frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The chart explicitly separates direction from axial rotation instead of treating three numbers as Euler angles.
 */
export type IAutoMovieSwingTwistChartPosition = {
  /** Dimensionless swing/radius ratio times cosine of azimuth; x*x + y*y <= 1 describes admitted swing, but chart does not clamp an outside rotation. */
  x: number;
  /** Dimensionless swing/radius ratio times sine of azimuth in the joint's swing basis. */
  y: number;
  /** Clinical twist in degrees, using the periodic alias nearest the allowed interval; not normalized to [0, 1] or clamped. */
  twist: number;
};
