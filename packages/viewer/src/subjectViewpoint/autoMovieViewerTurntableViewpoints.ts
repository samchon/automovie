import type { IAutoMovieViewerTurntableOptions } from "./IAutoMovieViewerTurntableOptions.js";
import type { IAutoMovieViewerViewpoint } from "./IAutoMovieViewerViewpoint.js";

/**
 * Generate fresh viewpoints in elevation-ring then azimuth order, with rounded whole-degree ids. Positive integer count, a nonempty ring list, positive multiplier and duplicate ids are checked; finite angles/multiplier and a practical output bound remain caller premises.
 *
 * @evidence contracts/common.md#principled-implementation Evenly spaces azimuths over 360 degrees and uses a Set to refuse duplicate rounded ids; default distance1.25 is a conventional context margin, not a measured visual quality guarantee.
 * @evidence contracts/common.md#clear-and-simple-design One plan loop owns names/order; actual subject bounds, lens, rendering and coverage observation stay downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate labels refuse rather than silently dropping an observation; rounded labels do not distinguish every distinct angle and no scene-specific samples are injected.
 * @evidence contracts/common.md#meaningful-documentation Documents ordering, default margin, rounded-name refusal and incomplete finite/population admission.
 * @evidence contracts/performance.md#efficient-algorithms Creates O(E*A) records and identity-set entries for E rings and A azimuths; no redundant search over prior records is needed.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation generates fresh records deterministically from its options; a caller can retain an unchanged plan but no render result is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary uniqueness Set leaves scope after return; consumer retention grows with E*A and there is no configured plan-size cap or native handle.
 */
export function autoMovieViewerTurntableViewpoints(options: IAutoMovieViewerTurntableOptions): IAutoMovieViewerViewpoint[] {
  if (
    Number.isInteger(options.azimuthCount) === false ||
    options.azimuthCount < 1
  )
    throw new RangeError(
      `turntable azimuth count must be a positive integer, not ${options.azimuthCount}`,
    );
  if (options.elevationsDeg.length === 0)
    throw new RangeError("turntable plan needs at least one elevation ring");
  const distanceFactor: number = options.distanceFactor ?? 1.25;
  if (distanceFactor <= 0)
    throw new RangeError(
      `turntable distance factor must be positive, not ${distanceFactor}`,
    );
  const viewpoints: IAutoMovieViewerViewpoint[] = [];
  const taken: Set<string> = new Set<string>();
  for (const elevationDeg of options.elevationsDeg)
    for (let index: number = 0; index < options.azimuthCount; index++) {
      const azimuthDeg: number = (360 / options.azimuthCount) * index;
      const id: string = `az${degreeLabel(azimuthDeg)}-el${degreeLabel(elevationDeg)}`;
      // Two rings rounding to one label would give two viewpoints the same name, leaving a coverage tally unable to distinguish them.
      if (taken.has(id))
        throw new RangeError(
          `turntable plan produces viewpoint id "${id}" twice; separate its elevation rings by at least one degree`,
        );
      taken.add(id);
      viewpoints.push({ id, azimuthDeg, elevationDeg, distanceFactor });
    }
  return viewpoints;
}

/** Signed whole degrees as a fixed-width label, so ids sort as they read. */
function degreeLabel(degrees: number): string {
  const rounded: number = Math.round(degrees);
  const magnitude: string = Math.abs(rounded).toString().padStart(3, "0");
  return rounded < 0 ? `n${magnitude}` : magnitude;
}
