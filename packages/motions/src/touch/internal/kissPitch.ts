import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The pitch that aims the mouth's circular path toward a point, in degrees. The
 * forward-bow axis is the body's left. In the plane of that circle, the vectors
 * from the hip to the mouth and from the hip to the point determine the minimum
 * squared distance on the unconstrained arc.
 * Parameter hip: The hip pivot, world metres.
 * Parameter yaw: The yaw about world up, degrees.
 * Parameter mouth: The unbowed mouth, world metres.
 * Parameter point: The point the arc approaches, world metres.
 * Returns: A signed pitch in degrees.
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
  const arc: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(mouth, hip);
  const radial: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    arc,
    AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(arc, axis)),
  );
  const toward: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(point, hip);
  return (
    (Math.atan2(
      AutoMovieEngineVector3.dot(toward, AutoMovieEngineVector3.cross(axis, radial)),
      AutoMovieEngineVector3.dot(toward, radial),
    ) *
      180) /
    Math.PI
  );
}
