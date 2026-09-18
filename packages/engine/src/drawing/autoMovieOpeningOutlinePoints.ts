import { IAutoMovieOpeningProfile, IAutoMoviePlanarPoint } from "@automovie/interface";
import { AUTOMOVIE_DRAWING_ARC_STEP } from "./AUTOMOVIE_DRAWING_ARC_STEP";

/** Below this the bulge is a straight edge, not an arc anybody can see. */
const BULGE_EPSILON = 1e-12;

/**
 * Flatten a profile outline into the points a drawing drafts it through.
 *
 * Straight edges contribute their own endpoint; a bulged edge contributes its
 * endpoint and then the chord points along its arc, so the returned ring is a
 * closed polyline ready to project. The density is fixed rather than adaptive
 * because an adaptive one would make a drawing's linework depend on the size of
 * the thing drawn, and two derivations of one revision could then differ.
 *
 * This is drafting, not measurement. Nothing that reports a dimension reads
 * these chords: {@link autoMovieOpeningExtent} answers from the engine's own
 * bounding hull instead, so the size a schedule prints is the size the wall
 * kernel cuts.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Produces the ordered opening boundary used to draft the void and measure its scheduled size from the same authored profile.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Expands each nonzero bulge through the fixed arc step while preserving straight segments and a single copy of every shared vertex.
 * @author Samchon
 */
export const autoMovieOpeningOutlinePoints = (
  profile: IAutoMovieOpeningProfile,
): IAutoMoviePlanarPoint[] => {
  const points: IAutoMoviePlanarPoint[] = [];
  for (let index = 0; index < profile.outline.length; ++index) {
    const from = profile.outline[index]!;
    const to = profile.outline[(index + 1) % profile.outline.length]!;
    points.push(from);
    const arc = arcOf(from, to, profile.bulges?.[index] ?? 0);
    if (arc === null) continue;
    const steps = Math.max(
      1,
      Math.ceil(Math.abs(arc.sweep) / AUTOMOVIE_DRAWING_ARC_STEP),
    );
    for (let step = 1; step < steps; ++step) {
      const angle = arc.start + (arc.sweep * step) / steps;
      points.push({
        x: arc.center.x + arc.radius * Math.cos(angle),
        y: arc.center.y + arc.radius * Math.sin(angle),
      });
    }
  }
  return points;
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
