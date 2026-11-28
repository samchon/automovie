import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
} from "@automovie/interface";

/*
 * Evaluate the calibrated pixel and the gradient in camera coordinates.
 * Depth must be admitted before homogeneous division.
 */
export function evaluateRecoveryMapProjectionChart(
  [xPhysical, yPhysical, depth]: Readonly<AutoMovieVector3Tuple>,
  intrinsic: readonly number[],
): IRecoveryMapProjectionChart {
  const x: number = xPhysical / depth;
  const y: number = yPhysical / depth;
  return {
    pixel: [
      intrinsic[0]! * x + intrinsic[1]! * y + intrinsic[2]!,
      intrinsic[4]! * y + intrinsic[5]!,
    ],
    gradient: [
      [
        intrinsic[0]! / depth,
        intrinsic[1]! / depth,
        -(intrinsic[0]! * x + intrinsic[1]! * y) / depth,
      ],
      [0, intrinsic[4]! / depth, (-intrinsic[4]! * y) / depth],
    ],
  };
}

interface IRecoveryMapProjectionChart {
  pixel: AutoMovieVector2Tuple;
  gradient: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
