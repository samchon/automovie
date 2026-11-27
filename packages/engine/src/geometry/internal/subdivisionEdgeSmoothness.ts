/*
 * How much of the smooth Catmull-Clark edge rule an edge of the given sharpness
 * takes; the rest is the sharp midpoint rule.
 *
 * DeRose, Kass and Truong (1998) use the sharp rule for sharpness of one or
 * more and interpolate linearly between the smooth and sharp edge points for a
 * fractional sharpness below one, so the smooth share is `1 - s` there and zero
 * from one upwards, including boundary edges at 10.
 * Parameter sharpness: Edge sharpness from 0 to 10.
 * Returns: The weight of the smooth edge point, from 0 to 1.
 */
export const subdivisionEdgeSmoothness = (sharpness: number): number =>
  sharpness >= 1 ? 0 : 1 - sharpness;
