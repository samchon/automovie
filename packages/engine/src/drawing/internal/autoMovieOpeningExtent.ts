import {
  type IAutoMovieOpeningExtent,
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { outlineHull } from "../../architecture/internal/outlineHull";
import { polygonBounds } from "../../architecture/internal/polygonBounds";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The width and height of an opening's void, in its host face's metres, on the
 * drawing grid.
 *
 * Taken from the engine's own bounding hull of the outline rather than a second
 * arithmetic: `builtBoundaryWallCut` hands that hull to the mesh kernel as the
 * rectangle it cuts, and validation holds the void inside its face by the same
 * hull, so the schedule prints the size of the hole the building has. The hull
 * is tight for an arc on a chord parallel to a face axis, such as an arched
 * head or a round oculus written as two half turns, and larger than the arc for
 * a tilted chord.
 *
 * @param profile Opening profile with its outline and optional bulges.
 * @returns Extent along the face's local X (`width`) and Y (`height`).
 */
export const autoMovieOpeningExtent = (
  profile: IAutoMovieOpeningProfile,
): IAutoMovieOpeningExtent.IResult => {
  const bounds: { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } =
    polygonBounds(outlineHull(profile));
  return {
    width: roundAutoMovieDrawingScalar(bounds.max.x - bounds.min.x),
    height: roundAutoMovieDrawingScalar(bounds.max.y - bounds.min.y),
  };
};
