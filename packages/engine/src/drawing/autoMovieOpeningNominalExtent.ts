import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltOpening,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingElementTriangles } from "./autoMovieDrawingElementTriangles";
import { autoMovieOpeningExtent } from "./autoMovieOpeningExtent";
import { autoMovieOpeningFillExtent } from "./autoMovieOpeningFillExtent";

/**
 * The nominal width and height of one opening, and what they were measured
 * from, or `null` when nothing in the design sizes it.
 *
 * The opening's own void wins: it is the only record that describes the hole,
 * and its size is the hull the wall kernel cuts (`basis: "profile"`). Without
 * one, the filling element's world extent stands in (`basis: "fill"`), which
 * is the leaf and not the hole, so every caller labels it. An opening with
 * neither, or whose fill has no environment-owned model or no triangles, is
 * `null`. The drawing and the schedule both read this, so a sheet and a
 * schedule cannot size one opening two ways.
 *
 * @param design Index of the validated design that owns the opening.
 * @param opening Opening to size.
 * @returns The basis and the size in metres on the drawing grid, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Prefers the profile's hull extent from `autoMovieOpeningExtent`, which is the cut the wall kernel makes, and otherwise measures the fill's placed triangles with `autoMovieOpeningFillExtent`; validation guarantees a profiled opening's host has a face and a fill resolves, the premises these readings rely on.
 * @evidence contracts/common.md#clear-and-simple-design The one sizing rule the drawing's opening marks and the schedule's opening rows share, returning a basis each caller maps onto its own vocabulary of `none` or `unmeasured`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening kind is special-cased; a stand-in measurement is labelled `fill` rather than passed off as the hole's size, and an unmeasurable opening is `null` rather than zero.
 * @evidence contracts/common.md#meaningful-documentation The comment states the precedence, what each basis means, every case that yields `null`, the units and rounding, and which consumers share the rule.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the profile's edges for a void, or in the fill model's triangles for a stand-in, measured in three folds without argument spreading.
 * @evidence contracts/performance.md#reuse-equivalent-work A fill model's tessellation is reused through the design index, so many openings filled by one leaf model tessellate it once per derivation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The placed fill triangles and corner list are temporaries released when the call returns; only a small record is returned.
 * @author Samchon
 */
export const autoMovieOpeningNominalExtent = (
  design: IAutoMovieDrawingDesignIndex,
  opening: IAutoMovieBuiltOpening,
): { basis: "profile" | "fill"; width: number; height: number } | null => {
  if (opening.profile !== undefined)
    return { basis: "profile", ...autoMovieOpeningExtent(opening.profile) };
  const element: IAutoMovieBuiltElement | undefined =
    opening.fill === null ? undefined : design.elements.get(opening.fill);
  const model: IAutoMovieModel | undefined =
    element === undefined || element.model === null
      ? undefined
      : design.models.get(element.model);
  if (element === undefined || model === undefined) return null;
  const corners: IAutoMovieVector3[] = autoMovieDrawingElementTriangles(
    design,
    element,
    model,
  ).flatMap((triangle: IAutoMovieDrawingTriangle): IAutoMovieVector3[] => [
    triangle.a,
    triangle.b,
    triangle.c,
  ]);
  if (corners.length === 0) return null;
  return { basis: "fill", ...autoMovieOpeningFillExtent(corners) };
};
