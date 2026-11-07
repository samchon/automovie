import { FilmVector as V } from "./FilmVector";

/**
 * The highest knee a two-segment leg allows for a hip and an ankle: the knee
 * lies on the circle where the thigh sphere around the hip meets the shank
 * sphere around the ankle, and this takes that circle's highest point. When
 * the ankle lies beyond the extended leg, the knee lies on the straight line.
 */
export function filmHighestKnee(hip: V.Value, ankle: V.Value, thigh: number, shank: number): V.Value {
  const span: V.Value = V.sub(ankle, hip);
  const distance: number = V.length(span);
  if (distance === 0) return V.add(hip, [0, thigh, 0]);
  const axis: V.Value = V.scale(span, 1 / distance);
  if (distance >= thigh + shank) return V.add(hip, V.scale(axis, thigh));
  // Distance from the hip to the circle's plane and the circle's radius.
  const along: number = Math.max(-thigh, Math.min(thigh, (thigh * thigh - shank * shank + distance * distance) / (2 * distance)));
  const radius: number = Math.sqrt(Math.max(0, thigh * thigh - along * along));
  const up: V.Value = V.sub([0, 1, 0], V.scale(axis, axis[1]));
  const lift: number = V.length(up);
  const center: V.Value = V.add(hip, V.scale(axis, along));
  return lift === 0 ? center : V.add(center, V.scale(up, radius / lift));
}
