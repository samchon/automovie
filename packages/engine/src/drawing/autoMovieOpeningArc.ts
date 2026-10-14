import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { IAutoMovieOpeningArc } from "./IAutoMovieOpeningArc";
import { AUTOMOVIE_OPENING_BULGE_EPSILON } from "./constants/AUTOMOVIE_OPENING_BULGE_EPSILON";

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
 *
 * @evidence contracts/common.md#principled-implementation Recovers the circle from the chord and the bulge by the closed-form relations `offset = chord (1 - b^2) / (4 b)` and `sweep = -4 atan(b)`, which follow from the bulge being the tangent of a quarter of the sweep; the premise that a sweep is at most a half turn holds because validation bounds the bulge.
 * @evidence contracts/common.md#clear-and-simple-design The single owner of the bulge-to-arc conversion, shared by the drafted outline and the exact area so the two cannot disagree about which way an arch curves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening or bulge value is special-cased; a vanishing bulge or chord is straight because the circle degenerates there, not to dodge a fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the bulge definition and sign convention, where the centre and sweep fall, when an edge counts as straight, the units and the validated range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time: a few square roots and trigonometric calls, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time pure function called once per edge by each consumer; caching would cost more than the arithmetic.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The arc record lives only for the edge being drafted or measured and is dropped by its caller in the same loop iteration.
 * @author Samchon
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
