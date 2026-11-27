import {
  type IAutoMovieOpeningArc,
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { openingArc } from "./openingArc";
import { AutoMovieEngineDrawingArcStep } from "../AutoMovieEngineDrawingArcStep";

/*
 * Flatten a profile outline into the points a drawing drafts it through.
 *
 * Each edge contributes its start point, and a bulged edge then contributes the
 * interior chord points of its arc at a fixed angular step of
 * AutoMovieEngineDrawingArcStep, so the returned ring is an implicitly
 * closed polyline in the profile's planar frame. The density is fixed rather
 * than adaptive so a drawing's linework, and its digest, depend on the design
 * and not on the size of the arc.
 *
 * This is drafting, not measurement: the schedule reads the hull through
 * `openingExtent` and the take-off reads the exact area through
 * `openingArea`, and neither reads these chords.
 * Parameter profile: Opening profile with its outline and optional bulges.
 * Returns: The drafted ring, in profile-frame metres.
 */
export const openingOutlinePoints = (
  profile: IAutoMovieOpeningProfile,
): IAutoMoviePlanarPoint[] => {
  const points: IAutoMoviePlanarPoint[] = [];
  for (let index: number = 0; index < profile.outline.length; ++index) {
    const from: IAutoMoviePlanarPoint = profile.outline[index]!;
    const to: IAutoMoviePlanarPoint =
      profile.outline[(index + 1) % profile.outline.length]!;
    points.push(from);
    const arc: IAutoMovieOpeningArc | null = openingArc(
      from,
      to,
      profile.bulges?.[index] ?? 0,
    );
    if (arc === null) continue;
    const steps: number = Math.max(
      1,
      Math.ceil(Math.abs(arc.sweep) / AutoMovieEngineDrawingArcStep),
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
