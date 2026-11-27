import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A share of the shortest turn taking one direction onto another.
 */
export function HumanMountPushTurned(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  share: number,
): IAutoMovieQuaternion {
  const a: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(from);
  const b: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(to);
  const axis: IAutoMovieVector3 = AutoMovieEngineVector3.cross(a, b);
  const sine: number = AutoMovieEngineVector3.length(axis);
  if (sine < 1e-9) return AutoMovieEngineQuaternion.identity();
  return AutoMovieEngineQuaternion.fromAxisAngle(
    AutoMovieEngineVector3.scale(axis, 1 / sine),
    (share * Math.atan2(sine, AutoMovieEngineVector3.dot(a, b))) / AutoMovieEngineQuaternion.DEG2RAD,
  );
}
