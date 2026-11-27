import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The unit part of `v` square to the unit `axis`, or null where none is left.
 */
export function HumanMountPushSquare(
  v: IAutoMovieVector3,
  axis: IAutoMovieVector3,
): IAutoMovieVector3 | null {
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    v,
    AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(axis, v)),
  );
  return AutoMovieEngineVector3.length(across) < 1e-9 ? null : AutoMovieEngineVector3.normalize(across);
}
