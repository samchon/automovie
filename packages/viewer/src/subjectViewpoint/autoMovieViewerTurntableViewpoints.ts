import type { IAutoMovieViewerTurntableOptions } from "./IAutoMovieViewerTurntableOptions.js";
import type { IAutoMovieViewerViewpoint } from "./IAutoMovieViewerViewpoint.js";

/**
 * Lay out a deterministic ring of viewpoints around a subject.
 *
 * Cheap and reproducible beats complete: a horizontal sweep at a couple of
 * elevations shows a proportion, a missing head, and a brace running at the
 * wrong angle, which is what the defects that survived one whole campaign
 * actually were. The identities are derived from the angles, so the same
 * options always name the same viewpoints and a coverage record can say which
 * of them an inspection reached.
 *
 * @author Samchon
 */
export const autoMovieViewerTurntableViewpoints = (
  options: IAutoMovieViewerTurntableOptions,
): IAutoMovieViewerViewpoint[] => {
  if (
    Number.isInteger(options.azimuthCount) === false ||
    options.azimuthCount < 1
  )
    throw new RangeError(
      `turntable azimuth count must be a positive integer, not ${options.azimuthCount}`,
    );
  if (options.elevationsDeg.length === 0)
    throw new RangeError("turntable plan needs at least one elevation ring");
  const distanceFactor = options.distanceFactor ?? 1.25;
  if (distanceFactor <= 0)
    throw new RangeError(
      `turntable distance factor must be positive, not ${distanceFactor}`,
    );
  const viewpoints: IAutoMovieViewerViewpoint[] = [];
  const taken = new Set<string>();
  for (const elevationDeg of options.elevationsDeg)
    for (let index = 0; index < options.azimuthCount; index++) {
      const azimuthDeg = (360 / options.azimuthCount) * index;
      const id = `az${degreeLabel(azimuthDeg)}-el${degreeLabel(elevationDeg)}`;
      // Two rings rounding to one label would give one plan two viewpoints
      // under one name, and a coverage tally could then never say which of
      // them was observed.
      if (taken.has(id))
        throw new RangeError(
          `turntable plan produces viewpoint id "${id}" twice; separate its elevation rings by at least one degree`,
        );
      taken.add(id);
      viewpoints.push({ id, azimuthDeg, elevationDeg, distanceFactor });
    }
  return viewpoints;
};

/** Signed whole degrees as a fixed-width label, so ids sort as they read. */
const degreeLabel = (degrees: number): string => {
  const rounded = Math.round(degrees);
  const magnitude = Math.abs(rounded).toString().padStart(3, "0");
  return rounded < 0 ? `n${magnitude}` : magnitude;
};
