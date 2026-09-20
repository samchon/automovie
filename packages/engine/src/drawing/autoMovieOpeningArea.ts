import { IAutoMovieOpeningProfile, IAutoMoviePlanarPoint } from "@automovie/interface";
import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/** Below this the bulge is a straight edge, not an arc anybody can see. */
const BULGE_EPSILON = 1e-12;

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

/** The circle one bulged edge runs on. */
interface IArc {
  center: IAutoMoviePlanarPoint;
  radius: number;
  start: number;
  sweep: number;
}

const arcOf = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  bulge: number,
): IArc | null => {
  if (Math.abs(bulge) <= BULGE_EPSILON) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const chord = Math.hypot(dx, dy);
  if (chord <= BULGE_EPSILON) return null;
  // The bulge is `tan(|sweep| / 4)` and, in this design's convention, a positive
  // one bulges to the LEFT of the edge's own direction — the same convention
  // `outlineHull` places its sagitta by, because two spellings of which way an
  // arch curves is one spelling too many. The centre therefore sits on the
  // opposite side of the chord from the bulge, at the signed distance below,
  // which runs off to infinity exactly as the bulge goes to zero and the arc
  // becomes the chord; and the sweep runs clockwise for a positive bulge, which
  // is what puts the arc on the left.
  const offset = (chord * (1 - bulge * bulge)) / (4 * bulge);
  const center = {
    x: (from.x + to.x) / 2 + (offset * dy) / chord,
    y: (from.y + to.y) / 2 - (offset * dx) / chord,
  };
  return {
    center,
    radius: Math.hypot(chord / 2, offset),
    start: Math.atan2(from.y - center.y, from.x - center.x),
    sweep: -4 * Math.atan(bulge),
  };
};
