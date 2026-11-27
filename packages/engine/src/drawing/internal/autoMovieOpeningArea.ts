import {
  type IAutoMovieOpeningArc,
  IAutoMovieOpeningProfile,
} from "@automovie/interface";

import { polygonDoubleArea } from "../../architecture/internal/polygonDoubleArea";
import { autoMovieOpeningArc } from "./autoMovieOpeningArc";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/*
 * The exact area of an opening's void, in square metres, on the drawing grid.
 *
 * Exact rather than the bounding hull's area, because an area is what glass is
 * ordered by while the hull is what a hole is cut for: the hull errs towards
 * refusing, and carrying that error into a take-off would over-order every
 * arch. The straight polygon's signed area is corrected by each arc's circular
 * segment `r^2 (sweep - sin sweep) / 2` in closed form, not by sampling the
 * chords the drawing drafts. The result is unsigned, so the outline may wind
 * either way, and the profile must be the validated simple outline.
 * Parameter profile: Opening profile with its outline and optional bulges.
 * Returns: The void's area in square metres, rounded to the drawing grid.
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
