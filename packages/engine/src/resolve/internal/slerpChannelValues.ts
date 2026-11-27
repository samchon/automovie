import type { IAutoMovieQuaternion } from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";

/*
 * Spherically interpolate admitted XYZW rotation channels on the shortest arc.
 */
export function slerpChannelValues(
  a: number[],
  b: number[],
  t: number,
): number[] {
  const q: IAutoMovieQuaternion = Quaternion.slerp(
    { x: a[0]!, y: a[1]!, z: a[2]!, w: a[3]! },
    { x: b[0]!, y: b[1]!, z: b[2]!, w: b[3]! },
    t,
  );
  return [q.x, q.y, q.z, q.w];
}
