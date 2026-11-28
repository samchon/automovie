import { AutoMovieEngineMatrix3 } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryMapPose,
} from "@automovie/interface";

/*
 * Keep rotation-only coordinates for left-rotation derivatives beside the
 * translated camera point. The callers own their representable-depth checks.
 */
export function transformRecoveryMapPoint(
  pose: IAutoMovieRecoveryMapPose,
  point: Readonly<AutoMovieVector3Tuple>,
): IRecoveryMapPointCoordinates {
  const rotated: AutoMovieVector3Tuple = AutoMovieEngineMatrix3.apply(
    pose.rotation,
    point,
  );
  return {
    rotated,
    camera: [
      rotated[0] + pose.translation[0],
      rotated[1] + pose.translation[1],
      rotated[2] + pose.translation[2],
    ],
  };
}

interface IRecoveryMapPointCoordinates {
  rotated: AutoMovieVector3Tuple;
  camera: AutoMovieVector3Tuple;
}
