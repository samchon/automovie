/**
 * A rotation's place in the range's chart: its swing as a share of the region's
 * radius on its own great circle, laid out on the unit disc by its azimuth
 * (`x`, `y`), and its twist read inside the interval (`twist`). The region is
 * star-shaped about the rest direction with a radius below 180 degrees on every
 * great circle (`ISwingTwist.reach`), so the region is the unit disc exactly,
 * the rest direction its centre, and the chart is continuous and one to one
 * over it: the rest direction's antipode, where a direction has no azimuth and
 * a rotation no twist, lies outside.
 */
export type IAutoMovieSwingTwistChartPosition = {
  /**
   * Dimensionless swing/radius ratio times cosine of azimuth; x_x + y_y <= 1
   * describes admitted swing, but chart does not clamp an outside rotation.
   */
  x: number;
  /**
   * Dimensionless swing/radius ratio times sine of azimuth in the joint's swing
   * basis.
   */
  y: number;
  /**
   * Clinical twist in degrees, using the periodic alias nearest the allowed
   * interval; not normalized to [0, 1] or clamped.
   */
  twist: number;
};
