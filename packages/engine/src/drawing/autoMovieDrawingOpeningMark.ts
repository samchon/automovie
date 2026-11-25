import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltOpening,
  type IAutoMovieDrawingDesignIndex,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingOpeningMark,
  IAutoMovieDrawingPoint,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { autoMovieBoundaryFacePoint } from "./autoMovieBoundaryFacePoint";
import { autoMovieOpeningNominalExtent } from "./autoMovieOpeningNominalExtent";
import { autoMovieOpeningOutlinePoints } from "./autoMovieOpeningOutlinePoints";
import { projectAutoMovieDrawingPoint } from "./projectAutoMovieDrawingPoint";
import { roundAutoMovieDrawingPoint } from "./roundAutoMovieDrawingPoint";

/**
 * One opening as a drawing can state it, and what that statement rests on.
 *
 * The size and basis come from {@link autoMovieOpeningNominalExtent}, the rule
 * the schedule also reads: an opening with its own void is marked with `basis:
 * "profile"`, its hull size, and its drafted outline placed on the host
 * boundary's face and projected onto the page on the grid; one sized by its
 * filling element is `basis: "fill"` with an empty outline, because the leaf's
 * extent is not the hole's shape; one with neither is `basis: "none"` with
 * `null` sizes. Validation guarantees a profiled opening's host boundary has a
 * face, which the outline placement relies on.
 *
 * @param design Index of the validated design.
 * @param frame The view's page basis.
 * @param opening Opening to mark.
 * @returns The opening's mark, carrying its identity, basis, outline and size.
 */
export const autoMovieDrawingOpeningMark = (
  design: IAutoMovieDrawingDesignIndex,
  frame: IAutoMovieDrawingFrame,
  opening: IAutoMovieBuiltOpening,
): IAutoMovieDrawingOpeningMark => {
  const identity: Pick<
    IAutoMovieDrawingOpeningMark,
    "opening" | "boundary" | "kind" | "fill"
  > = {
    opening: opening.id,
    boundary: opening.boundary,
    kind: opening.kind,
    fill: opening.fill,
  };
  const extent: {
    basis: "profile" | "fill";
    width: number;
    height: number;
  } | null = autoMovieOpeningNominalExtent(design, opening);
  if (extent === null)
    return {
      ...identity,
      basis: "none",
      polygon: [],
      width: null,
      height: null,
    };
  if (extent.basis === "fill")
    return {
      ...identity,
      basis: "fill",
      polygon: [],
      width: extent.width,
      height: extent.height,
    };
  const boundary: IAutoMovieBuiltBoundary = design.boundaries.get(
    opening.boundary,
  )!;
  return {
    ...identity,
    basis: "profile",
    polygon: autoMovieOpeningOutlinePoints(opening.profile!).map(
      (point: IAutoMoviePlanarPoint): IAutoMovieDrawingPoint =>
        roundAutoMovieDrawingPoint(
          projectAutoMovieDrawingPoint(
            frame,
            autoMovieBoundaryFacePoint(boundary.face!, point),
          ),
        ),
    ),
    width: extent.width,
    height: extent.height,
  };
};
