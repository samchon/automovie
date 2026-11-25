import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The pitch that aims the mouth's circular path toward a point, in degrees. The
 * forward-bow axis is the body's left. In the plane of that circle, the vectors
 * from the hip to the mouth and from the hip to the point determine the minimum
 * squared distance on the unconstrained arc.
 *
 * @param hip The hip pivot, world metres.
 * @param yaw The yaw about world up, degrees.
 * @param mouth The unbowed mouth, world metres.
 * @param point The point the arc approaches, world metres.
 * @returns A signed pitch in degrees.
 */
export function kissPitch(
  hip: IAutoMovieVector3,
  yaw: number,
  mouth: IAutoMovieVector3,
  point: IAutoMovieVector3,
): number {
  const around: number = (yaw * Math.PI) / 180;
  const axis: IAutoMovieVector3 = {
    x: Math.cos(around),
    y: 0,
    z: -Math.sin(around),
  };
  const arc: IAutoMovieVector3 = Vector3.subtract(mouth, hip);
  const radial: IAutoMovieVector3 = Vector3.subtract(
    arc,
    Vector3.scale(axis, Vector3.dot(arc, axis)),
  );
  const toward: IAutoMovieVector3 = Vector3.subtract(point, hip);
  return (
    (Math.atan2(
      Vector3.dot(toward, Vector3.cross(axis, radial)),
      Vector3.dot(toward, radial),
    ) *
      180) /
    Math.PI
  );
}
