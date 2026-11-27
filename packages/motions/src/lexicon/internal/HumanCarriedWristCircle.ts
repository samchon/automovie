import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
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
  const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(normal);
  const hand: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(wrist, point);
  const arm: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(shoulder, point);
  const handAxial: number = AutoMovieEngineVector3.dot(hand, axis);
  const armAxial: number = AutoMovieEngineVector3.dot(arm, axis);
  const handRadius: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
    hand,
    axis,
    -handAxial,
  );
  const armRadius: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(arm, axis, -armAxial);
  return {
    distance: Math.hypot(
      armAxial - handAxial,
      AutoMovieEngineVector3.length(armRadius) - AutoMovieEngineVector3.length(handRadius),
    ),
    degrees:
      (Math.atan2(
        AutoMovieEngineVector3.dot(axis, AutoMovieEngineVector3.cross(handRadius, armRadius)),
        AutoMovieEngineVector3.dot(handRadius, armRadius),
      ) *
        180) /
      Math.PI,
  };
}

/*
 * The nearest wrist on the circle traced by rotating a palm about its contact
 * normal.
 */
interface ICarriedWristCircle {
  /*
   * Distance from the fixed shoulder to that wrist, metres.
   */
  distance: number;
  /*
   * Signed turn about the outward normal, degrees.
   */
  degrees: number;
}
