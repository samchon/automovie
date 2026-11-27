import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The nearest wrist on the circle traced by rotating a palm about its contact
 * normal.
 */
interface ICarriedWristCircle {
  /** Distance from the fixed shoulder to that wrist, metres. */
  distance: number;
  /** Signed turn about the outward normal, degrees. */
  degrees: number;
}

/**
 * The wrist and the shoulder project to two radii in the plane orthogonal to
 * the contact normal. Aligning those radii minimizes their separation while
 * preserving the exact contact point and palm normal.
 */
export function HumanCarriedWristCircle(
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  shoulder: IAutoMovieVector3,
): ICarriedWristCircle {
  const axis: IAutoMovieVector3 = Vector3.normalize(normal);
  const hand: IAutoMovieVector3 = Vector3.subtract(wrist, point);
  const arm: IAutoMovieVector3 = Vector3.subtract(shoulder, point);
  const handAxial: number = Vector3.dot(hand, axis);
  const armAxial: number = Vector3.dot(arm, axis);
  const handRadius: IAutoMovieVector3 = Vector3.addScaled(
    hand,
    axis,
    -handAxial,
  );
  const armRadius: IAutoMovieVector3 = Vector3.addScaled(arm, axis, -armAxial);
  return {
    distance: Math.hypot(
      armAxial - handAxial,
      Vector3.length(armRadius) - Vector3.length(handRadius),
    ),
    degrees:
      (Math.atan2(
        Vector3.dot(axis, Vector3.cross(handRadius, armRadius)),
        Vector3.dot(handRadius, armRadius),
      ) *
        180) /
      Math.PI,
  };
}
