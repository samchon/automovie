import { AutoMovieDrawingProjection } from "@automovie/interface";

/**
 * Whether a projection cuts: removes the material on the viewer's side of its
 * plane and drafts what the plane passes through.
 *
 * Every projection except `elevation` cuts, so a plan, a reflected ceiling plan
 * and a section all draw cut linework and room regions, while an elevation
 * only projects. A new projection added to the closed union is a cutting one
 * unless this rule is changed with it.
 *
 * @param projection The view's projection.
 * @returns `true` for every projection other than `elevation`.
 *
 * @evidence contracts/common.md#principled-implementation Decides from the closed `AutoMovieDrawingProjection` union by its one non-cutting member, which is the drafting meaning of an elevation as an uncut projection.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns the cut rule that line drafting, clipping and region sectioning all read, so the three cannot disagree about whether a view cuts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No view or consumer is special-cased; the only distinction is the contract's own projection value.
 * @evidence contracts/common.md#meaningful-documentation The comment states what cutting means for a drawing, which projections cut, and how a future projection would be classified.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One string comparison, so there is no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time pure predicate evaluated once per derivation; there is no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compares one string and returns a boolean, so no object, handle or task exists to release.
 * @author Samchon
 */
export const autoMovieDrawingHasCut = (
  projection: AutoMovieDrawingProjection,
): boolean => projection !== "elevation";
