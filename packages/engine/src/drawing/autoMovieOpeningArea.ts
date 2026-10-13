import { IAutoMovieOpeningProfile } from "@automovie/interface";

import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { IAutoMovieOpeningArc } from "./IAutoMovieOpeningArc";
import { autoMovieOpeningArc } from "./autoMovieOpeningArc";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The exact area of an opening's void, in square metres, on the drawing grid.
 *
 * Exact rather than the bounding hull's area, because an area is what glass is
 * ordered by while the hull is what a hole is cut for: the hull errs towards
 * refusing, and carrying that error into a take-off would over-order every
 * arch. The straight polygon's signed area is corrected by each arc's circular
 * segment `r^2 (sweep - sin sweep) / 2` in closed form, not by sampling the
 * chords the drawing drafts. The result is unsigned, so the outline may wind
 * either way, and the profile must be the validated simple outline.
 *
 * @param profile Opening profile with its outline and optional bulges.
 * @returns The void's area in square metres, rounded to the drawing grid.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace area of the straight outline plus the signed circular-segment area of each bulged edge, which is exact for a simple outline whose arcs cross no other edge, the outline validation accepts; the segment's sign follows the sweep, so an arc bulging inward subtracts and one bulging outward adds whichever way the outline winds.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the opening area for the take-off, reusing `polygonDoubleArea` for the straight part and `autoMovieOpeningArc` for each edge's circle, so the area and the drafted outline read one arc convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening shape is special-cased, and the hull the wall kernel cuts is deliberately not used because it measures a different quantity.
 * @evidence contracts/common.md#meaningful-documentation The comment states the unit and rounding, why the exact area is used instead of the hull, the segment formula, the winding independence and the validated-outline premise.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `n` outline edges plus the shoelace pass, linear time and constant extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per opening per quantity report; nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one small arc record per bulged edge and retains nothing.
 * @author Samchon
 */
export const autoMovieOpeningArea = (
  profile: IAutoMovieOpeningProfile,
): number => {
  let doubled: number = polygonDoubleArea(profile.outline);
  for (let index: number = 0; index < profile.outline.length; ++index) {
    const arc: IAutoMovieOpeningArc | null = autoMovieOpeningArc(
      profile.outline[index]!,
      profile.outline[(index + 1) % profile.outline.length]!,
      profile.bulges?.[index] ?? 0,
    );
    if (arc === null) continue;
    doubled += arc.radius * arc.radius * (arc.sweep - Math.sin(arc.sweep));
  }
  return roundAutoMovieDrawingScalar(Math.abs(doubled) / 2);
};
