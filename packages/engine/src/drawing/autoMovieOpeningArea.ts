import { IAutoMovieOpeningProfile } from "@automovie/interface";
import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The exact area of an opening's void, in square metres.
 *
 * Exact rather than the bounding hull's area, because an area is a quantity
 * somebody orders glass by while an extent is a rectangle somebody cuts a hole
 * for: the hull that governs the cut deliberately errs towards refusing, and
 * carrying that error into a take-off would over-order every arch in the
 * building. The straight polygon's own area is corrected by each arc's circular
 * segment, which is a closed form and not a sampling of the chords the drawing
 * happens to draft.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Measures the true void area of a straight or arced opening for the quantity report rather than substituting its bounding box.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Combines the profile's signed shoelace area with each bulge's closed-form circular-segment area, then rounds the absolute result.
 * @author Samchon
 */
export const autoMovieOpeningArea = (
  profile: IAutoMovieOpeningProfile,
): number => {
  let doubled = polygonDoubleArea(profile.outline);
  for (let index = 0; index < profile.outline.length; ++index) {
    const arc = arcOf(
      profile.outline[index]!,
      profile.outline[(index + 1) % profile.outline.length]!,
      profile.bulges?.[index] ?? 0,
    );
    if (arc === null) continue;
    doubled += arc.radius * arc.radius * (arc.sweep - Math.sin(arc.sweep));
  }
  return roundAutoMovieDrawingScalar(Math.abs(doubled) / 2);
};
