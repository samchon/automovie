import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Closest point to the preferred root in the intersection of two leg reaches.
 */
export function prepareMountTransfer(
  preferred: IAutoMovieVector3,
  near: IAutoMovieVector3,
  far: IAutoMovieVector3,
  reach: number,
): IAutoMovieVector3 | undefined {
  const between = AutoMovieEngineVector3.subtract(far, near);
  const distance = AutoMovieEngineVector3.length(between);
  if (distance > 2 * reach) return undefined;
  const onNear = prepareMountTransfer.restrict(preferred, near, reach);
  if (AutoMovieEngineVector3.distance(onNear, far) <= reach || distance === 0) return onNear;
  const onFar = prepareMountTransfer.restrict(preferred, far, reach);
  if (AutoMovieEngineVector3.distance(onFar, near) <= reach) return onFar;

  // Both lengths bind. The two spheres meet in a circle in their bisector.
  const centre = AutoMovieEngineVector3.lerp(near, far, 0.5);
  const normal = AutoMovieEngineVector3.scale(between, 1 / distance);
  const away = AutoMovieEngineVector3.subtract(preferred, centre);
  const inPlane = AutoMovieEngineVector3.subtract(
    away,
    AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(away, normal)),
  );
  return prepareMountTransfer.restrict(
    AutoMovieEngineVector3.add(centre, inPlane),
    centre,
    Math.sqrt(Math.max(0, (reach - distance / 2) * (reach + distance / 2))),
  );
}

/*
 * The closed-form geometric reach used by the transfer and single support.
 */
export namespace prepareMountTransfer {
  /*
   * Keep a point inside a ball, preserving the direction to its centre.
   */
  export function restrict(
    point: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    reach: number,
  ): IAutoMovieVector3 {
    const offset = AutoMovieEngineVector3.subtract(point, centre);
    const distance = AutoMovieEngineVector3.length(offset);
    return distance <= reach
      ? point
      : AutoMovieEngineVector3.add(centre, AutoMovieEngineVector3.scale(offset, reach / distance));
  }
}
