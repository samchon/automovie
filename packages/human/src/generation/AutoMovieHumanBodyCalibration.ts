import { AutoMovieHumanBodyRegions } from "./AutoMovieHumanBodyRegions";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanEarCalibration } from "./calibration/AutoMovieHumanEarCalibration";
import { AutoMovieHumanEyeCalibration } from "./calibration/AutoMovieHumanEyeCalibration";
import { AutoMovieHumanFootCalibration } from "./calibration/AutoMovieHumanFootCalibration";
import { AutoMovieHumanTorsoCalibration } from "./calibration/AutoMovieHumanTorsoCalibration";

/**
 * The body calibration the generator lofts: the union of the region
 * calibrations under `calibration/`, each owned by its own observation
 * fitter, with their trims applied.
 */
export const AutoMovieHumanBodyCalibration: IAutoMovieHumanBodyCalibration =
  AutoMovieHumanBodyRegions.merge([
    AutoMovieHumanTorsoCalibration,
    AutoMovieHumanFootCalibration,
    AutoMovieHumanEarCalibration,
    AutoMovieHumanEyeCalibration,
  ]);
