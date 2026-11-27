import { Quaternion } from "../../math/Quaternion";

/*
 * The spherical distance, degrees, from a unit direction to a rectangle of
 * latitudes and longitudes on the unit sphere: the directions `d(f, a) = (-sin
 * a, cos a sin f, cos a cos f)` with the middle angle `a` inside one interval
 * and the outer angle `f` inside another, which is the set a joint with two
 * free angles in a box carries one fixed axis to.
 *
 * Inside the rectangle's longitudes the distance is the middle angle's excess
 * past its interval. Outside them the nearest point lies on one of the two
 * bounding meridians, where the direction's cosine with the meridian point of
 * middle angle `a` is `-x sin a + c cos a`, `c = y sin e + z cos e` for the
 * meridian at outer angle `e`, greatest at the middle angle nearest `atan2(-x,
 * c)`.
 * Parameter x: The direction's component on the pole axis, the one the middle
 * angle's sine is the negative of.
 * Parameter y: Its component on the axis the outer angle's sine multiplies.
 * Parameter z: Its component on the axis the outer angle's cosine multiplies.
 * Parameter middle: The middle angle's interval, degrees within a quarter turn
 * either way.
 * Parameter outer: The outer angle's interval, degrees; null when every outer angle
 * is inside.
 * Returns: The distance, degrees; zero inside the rectangle.
 */
export function sphericalBoxMiss(
  x: number,
  y: number,
  z: number,
  middle: readonly [number, number],
  outer: readonly [number, number] | null,
): number {
  const D: number = Quaternion.DEG2RAD;
  const clamp = (value: number): number => Math.max(-1, Math.min(1, value));
  const [lowest, highest]: readonly [number, number] = middle;
  const abduction: number = Math.asin(clamp(-x)) / D;
  const band: number = Math.max(0, lowest - abduction, abduction - highest);
  if (outer === null) return band;
  const turned: number =
    (((Math.atan2(y, z) / D - outer[0]) % 360) + 360) % 360;
  if (turned <= outer[1] - outer[0]) return band;
  let least: number = Infinity;
  for (const end of outer) {
    const c: number = y * Math.sin(end * D) + z * Math.cos(end * D);
    const peak: number = Math.atan2(-x, c) / D;
    let cosine: number = Math.max(
      -x * Math.sin(lowest * D) + c * Math.cos(lowest * D),
      -x * Math.sin(highest * D) + c * Math.cos(highest * D),
    );
    if (peak >= lowest && peak <= highest)
      cosine = Math.max(cosine, Math.hypot(x, c));
    least = Math.min(least, Math.acos(clamp(cosine)) / D);
  }
  return least;
}
