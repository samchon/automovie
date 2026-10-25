import { AutoMovieHumanBodyRegions } from "./AutoMovieHumanBodyRegions";
import { AutoMovieHumanContactSmoothing } from "./AutoMovieHumanContactSmoothing";
import { AutoMovieHumanEventJoin } from "./AutoMovieHumanEventJoin";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanEarCalibration } from "./calibration/AutoMovieHumanEarCalibration";
import { AutoMovieHumanEyeCalibration } from "./calibration/AutoMovieHumanEyeCalibration";
import { AutoMovieHumanFootCalibration } from "./calibration/AutoMovieHumanFootCalibration";
import { AutoMovieHumanTorsoCalibration } from "./calibration/AutoMovieHumanTorsoCalibration";

/**
 * The calibration specimen's body: the union of the region calibrations
 * under `calibration/`, each owned by its own observation fitter, with
 * their trims applied, the sections next to the crotch low-passed
 * (`AutoMovieHumanContactSmoothing`), and every event's children re-sloped into their
 * parent's tangent plane (`AutoMovieHumanEventJoin`), since independently
 * fitted end slopes crease the shared rings.
 *
 * `AutoMovieHumanBodyLaw` maps it to the calibration of any parameter set.
 */
export const AutoMovieHumanBodyCalibration: IAutoMovieHumanBodyCalibration =
  AutoMovieHumanEventJoin.reconcile(
    AutoMovieHumanContactSmoothing.apply(
      AutoMovieHumanBodyRegions.merge([
        AutoMovieHumanTorsoCalibration,
        AutoMovieHumanFootCalibration,
        AutoMovieHumanEarCalibration,
        AutoMovieHumanEyeCalibration,
      ]),
    ),
  );
