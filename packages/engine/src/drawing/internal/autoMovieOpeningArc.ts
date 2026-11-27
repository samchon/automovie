import {
  type IAutoMovieOpeningArc,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { AUTOMOVIE_OPENING_BULGE_EPSILON } from "../AUTOMOVIE_OPENING_BULGE_EPSILON";

/**
 * The circular arc one opening-profile edge bulges along, or `null` when the
 * edge is straight.
 *
 * The bulge is the DXF value `tan(|sweep| / 4)`, and a positive bulge leans to
 * the left of the edge's own direction, the same convention `outlineHull`
 * places its sagitta by. The centre therefore sits on the chord's right for a
 * positive bulge, at a signed distance that runs to infinity as the bulge goes
 * to zero, and the sweep runs clockwise, which is what puts the arc on the
 * left. A bulge within {@link AUTOMOVIE_OPENING_BULGE_EPSILON} of zero, or an
 * edge with coincident ends, is straight.
 *
 * @param from Edge start, in profile-frame metres.
 * @param to Edge end, in profile-frame metres.
 * @param bulge The edge's bulge; validation keeps it within `[-1, 1]`.
 * @returns The arc's circle, start angle and signed sweep, or `null`.
 */
export const autoMovieOpeningArc = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  bulge: number,
): IAutoMovieOpeningArc | null => {
  if (Math.abs(bulge) <= AUTOMOVIE_OPENING_BULGE_EPSILON) return null;
  const dx: number = to.x - from.x;
  const dy: number = to.y - from.y;
  const chord: number = Math.hypot(dx, dy);
  if (chord <= AUTOMOVIE_OPENING_BULGE_EPSILON) return null;
  const offset: number = (chord * (1 - bulge * bulge)) / (4 * bulge);
  const center: IAutoMoviePlanarPoint = {
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
