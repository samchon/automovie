import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { IAutoMovieOpeningArc } from "./IAutoMovieOpeningArc";
import { autoMovieOpeningArc } from "./autoMovieOpeningArc";
import { AUTOMOVIE_DRAWING_ARC_STEP } from "./constants/AUTOMOVIE_DRAWING_ARC_STEP";

/**
 * Flatten a profile outline into the points a drawing drafts it through.
 *
 * Each edge contributes its start point, and a bulged edge then contributes
 * the interior chord points of its arc at a fixed angular step of
 * {@link AUTOMOVIE_DRAWING_ARC_STEP}, so the returned ring is an implicitly
 * closed polyline in the profile's planar frame. The density is fixed rather
 * than adaptive so a drawing's linework, and its digest, depend on the design
 * and not on the size of the arc.
 *
 * This is drafting, not measurement: the schedule reads the hull through
 * `autoMovieOpeningExtent` and the take-off reads the exact area through
 * `autoMovieOpeningArea`, and neither reads these chords.
 *
 * @param profile Opening profile with its outline and optional bulges.
 * @returns The drafted ring, in profile-frame metres.
 *
 * @evidence contracts/common.md#principled-implementation Uniform angular subdivision of each arc from `autoMovieOpeningArc`, which places every chord point exactly on the circle; the stated limitation is that the chords cut inside the arc by at most `r (1 - cos(step / 2))`.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the drafted ring of a profile and delegates the circle to the shared arc conversion, keeping measurement out of drafting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening is special-cased; the step is a named contract constant chosen for determinism rather than tuned per arc.
 * @evidence contracts/common.md#meaningful-documentation The comment states what each edge contributes, the closing convention, the frame, why the density is fixed, and which consumers measure instead of reading the chords.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the edge count plus the emitted chord points, at most sixteen per half-turn arc, so output size bounds the work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per drawn opening per derivation; nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The drafted ring is handed to the caller, which projects and rounds it at once; the arc records made per edge die with the loop iteration.
 * @author Samchon
 */
export const autoMovieOpeningOutlinePoints = (
  profile: IAutoMovieOpeningProfile,
): IAutoMoviePlanarPoint[] => {
  const points: IAutoMoviePlanarPoint[] = [];
  for (let index: number = 0; index < profile.outline.length; ++index) {
    const from: IAutoMoviePlanarPoint = profile.outline[index]!;
    const to: IAutoMoviePlanarPoint =
      profile.outline[(index + 1) % profile.outline.length]!;
    points.push(from);
    const arc: IAutoMovieOpeningArc | null = autoMovieOpeningArc(
      from,
      to,
      profile.bulges?.[index] ?? 0,
    );
    if (arc === null) continue;
    const steps: number = Math.max(
      1,
      Math.ceil(Math.abs(arc.sweep) / AUTOMOVIE_DRAWING_ARC_STEP),
    );
    for (let step: number = 1; step < steps; ++step) {
      const angle: number = arc.start + (arc.sweep * step) / steps;
      points.push({
        x: arc.center.x + arc.radius * Math.cos(angle),
        y: arc.center.y + arc.radius * Math.sin(angle),
      });
    }
  }
  return points;
};
