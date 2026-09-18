import { IAutoMovieOpeningProfile, IAutoMoviePlanarPoint } from "@automovie/interface";
import { AUTOMOVIE_DRAWING_ARC_STEP } from "./AUTOMOVIE_DRAWING_ARC_STEP";

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
