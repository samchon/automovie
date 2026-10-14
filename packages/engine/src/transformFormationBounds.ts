import {
  IAutoMovieFormationBounds,
  IAutoMovieFormationMotionState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { transformFormationPoint } from "./transformFormationPoint";

/**
 * Bound all eight transformed corners of a formation's axis-aligned box.
 *
 * @evidence contracts/common.md#principled-implementation An affine point transform maps the eight extrema, and per-axis minima/maxima produce the transformed AABB under finite representable inputs; rotation requires rebounding rather than transforming only min and max.
 * @evidence contracts/common.md#clear-and-simple-design Bounds compose the canonical formation point owner so placement and reporting use the same spacing, facing and translation semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arbitrary padding, consumer-specific envelope or input repair is added; extreme arithmetic and invalid authored boxes remain caller admission concerns.
 * @evidence contracts/common.md#meaningful-documentation Documents world-space AABB output and delegation to the point transform, including its horizontal scale and degree-angle policy.
 * @evidence contracts/performance.md#efficient-algorithms Eight point transforms plus fixed coordinate reductions take constant work and storage; repeated trig evaluations and small mapped arrays are paid within this owner.
 * @evidence contracts/performance.md#reuse-equivalent-work The same point rule is shared across all corners and consumers; no cheap fixed-size coefficient cache or mutable-bounds result cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh min/max vectors; corner and reduction arrays leave scope after completion and no renderer handle is retained.
 * @author Samchon
 */
export const transformFormationBounds: (
  bounds: IAutoMovieFormationBounds,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg?: number,
) => IAutoMovieFormationBounds = (
  bounds: IAutoMovieFormationBounds,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg: number = 0,
): IAutoMovieFormationBounds => {
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
};
