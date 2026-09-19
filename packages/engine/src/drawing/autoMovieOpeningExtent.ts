import { IAutoMovieOpeningProfile } from "@automovie/interface";
import { outlineHull } from "../architecture/outlineHull";
import { polygonBounds } from "../architecture/polygonBounds";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The size of an opening's void, in its host boundary's own metres.
 *
 * Deliberately the engine's existing bounding hull of the outline rather than a
 * second arithmetic of its own. `builtBoundaryWallCut` hands that same hull to
 * the mesh kernel as the rectangle it actually cuts, and validation holds the
 * void inside its face by the same hull, so a schedule that measured the arc
 * more finely would print a width no hole in the building has.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Reports the opening void's rounded nominal width and height from the same outline cut into its host face.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Reduces the canonical profile outline to its planar bounds and rounds both spans onto the drawing output grid.
 * @author Samchon
 */
export const autoMovieOpeningExtent = (
  profile: IAutoMovieOpeningProfile,
): { width: number; height: number } => {
  const bounds = polygonBounds(outlineHull(profile));
  return {
    width: roundAutoMovieDrawingScalar(bounds.max.x - bounds.min.x),
    height: roundAutoMovieDrawingScalar(bounds.max.y - bounds.min.y),
  };
};
