import {
  IAutoMovieFormationBounds,
  IAutoMovieFormationMotionState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { transformFormationPoint } from "./transformFormationPoint";

/*
 * Bound all eight transformed corners of a formation's axis-aligned box.
 */
export function transformFormationBounds(
  bounds: IAutoMovieFormationBounds,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg: number = 0,
): IAutoMovieFormationBounds {
  const corners: IAutoMovieVector3[] = [bounds.min.x, bounds.max.x].flatMap(
    (x: number): IAutoMovieVector3[] =>
      [bounds.min.y, bounds.max.y].flatMap((y: number): IAutoMovieVector3[] =>
        [bounds.min.z, bounds.max.z].map(
          (z: number): IAutoMovieVector3 =>
            transformFormationPoint({ x, y, z }, anchor, motion, baseFacingDeg),
        ),
      ),
  );
  return {
    min: {
      x: Math.min(
        ...corners.map((point: IAutoMovieVector3): number => point.x),
      ),
      y: Math.min(
        ...corners.map((point: IAutoMovieVector3): number => point.y),
      ),
      z: Math.min(
        ...corners.map((point: IAutoMovieVector3): number => point.z),
      ),
    },
    max: {
      x: Math.max(
        ...corners.map((point: IAutoMovieVector3): number => point.x),
      ),
      y: Math.max(
        ...corners.map((point: IAutoMovieVector3): number => point.y),
      ),
      z: Math.max(
        ...corners.map((point: IAutoMovieVector3): number => point.z),
      ),
    },
  };
}
