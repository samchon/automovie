import { IAutoMovieFormationBounds, IAutoMovieFormationMotionState, IAutoMovieVector3 } from "@automovie/interface";
import { transformFormationPoint } from "./transformFormationPoint";

/**
 * Where a formation's box sits once a cue has moved and rescaled it.
 *
 * The eight corners go through {@link transformFormationPoint} and are re-bound,
 * because a facing offset rotates the box and an axis-aligned answer has to be
 * measured after the rotation rather than around it.
 *
 * This lives beside the point transform it composes rather than beside either
 * caller. Two consumers ask where a unit is: the oracle reports it and the
 * builder refuses a unit standing off the ground its shot staged, and a
 * private copy in one of them is how the two come to disagree.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-motion-validation Recomputes conservative world bounds from every transformed corner for the current cue state.
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-declared-measured-bounds Keeps the declared local box separate from the measured world-axis box derived after the cue transform and facing rotation.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Supplies the same motion-aware bounds to framing reports and ground validation.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-bounds-inputs Derives the current world-space bound from the declared formation box, anchor, cue state, and facing without overwriting the input bound.
 */
export const transformFormationBounds = (
  bounds: IAutoMovieFormationBounds,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg = 0,
): IAutoMovieFormationBounds => {
  const corners = [bounds.min.x, bounds.max.x].flatMap((x) =>
    [bounds.min.y, bounds.max.y].flatMap((y) =>
      [bounds.min.z, bounds.max.z].map((z) =>
        transformFormationPoint({ x, y, z }, anchor, motion, baseFacingDeg),
      ),
    ),
  );
  return {
    min: {
      x: Math.min(...corners.map((point) => point.x)),
      y: Math.min(...corners.map((point) => point.y)),
      z: Math.min(...corners.map((point) => point.z)),
    },
    max: {
      x: Math.max(...corners.map((point) => point.x)),
      y: Math.max(...corners.map((point) => point.y)),
      z: Math.max(...corners.map((point) => point.z)),
    },
  };
};
