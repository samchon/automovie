import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Cylindrical coordinates about a chart axis. */
export interface IAutoMovieHumanSkinChartAxis {
  /**
   * Station along the axis, radius and angle of a point.
   *
   * @param p Point in mm
   * @param band Band index of the piece holding the point
   * @returns `[s, rho, theta]`, theta in `(-pi, pi]` with zero at the front reference
   */
  locate(p: Vec3, band: number): [number, number, number];

  /**
   * Point at cylindrical coordinates.
   *
   * @param s Station in mm
   * @param theta Angle in radians
   * @param rho Radius in mm
   * @returns Point in mm
   */
  point(s: number, theta: number, rho: number): Vec3;
}
