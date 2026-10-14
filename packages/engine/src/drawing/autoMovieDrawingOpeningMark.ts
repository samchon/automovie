import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltOpening,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingOpeningMark,
  IAutoMovieDrawingPoint,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { autoMovieBoundaryFacePoint } from "./autoMovieBoundaryFacePoint";
import { autoMovieOpeningNominalExtent } from "./autoMovieOpeningNominalExtent";
import { autoMovieOpeningOutlinePoints } from "./autoMovieOpeningOutlinePoints";
import { projectAutoMovieDrawingPoint } from "./projectAutoMovieDrawingPoint";
import { roundAutoMovieDrawingPoint } from "./roundAutoMovieDrawingPoint";

/**
 * One opening as a drawing can state it, and what that statement rests on.
 *
 * The size and basis come from {@link autoMovieOpeningNominalExtent}, the
 * rule the schedule also reads: an opening with its own void is marked with
 * `basis: "profile"`, its hull size, and its drafted outline placed on the
 * host boundary's face and projected onto the page on the grid; one sized by
 * its filling element is `basis: "fill"` with an empty outline, because the
 * leaf's extent is not the hole's shape; one with neither is `basis: "none"`
 * with `null` sizes. Validation guarantees a profiled opening's host boundary
 * has a face, which the outline placement relies on.
 *
 * @param design Index of the validated design.
 * @param frame The view's page basis.
 * @param opening Opening to mark.
 * @returns The opening's mark, carrying its identity, basis, outline and size.
 *
 * @evidence contracts/common.md#principled-implementation Places the drafted outline with the host face's rigid frame and projects it orthographically, the same placement the wall kernel and the drafter use, and sizes the mark with the shared nominal-extent rule; the face's presence is a validation premise, not a runtime guess.
 * @evidence contracts/common.md#clear-and-simple-design One function maps an opening onto the drawing's mark vocabulary, delegating sizing to the rule the schedule shares and outline drafting to `autoMovieOpeningOutlinePoints`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening kind is special-cased; a fill-sized mark is labelled `fill` and draws no outline rather than presenting a leaf as the hole, and an unsized one is `none` rather than zero.
 * @evidence contracts/common.md#meaningful-documentation The comment states each basis and what it carries, why a fill-sized mark has no outline, the rounding, and the face premise.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the profile's drafted points, or in the fill model's triangles through the shared sizing rule; the host boundary is a map lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work A fill model's tessellation is reused through the design index across every opening it fills within one derivation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one mark owned by the caller; the drafted outline points are temporaries.
 * @author Samchon
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
