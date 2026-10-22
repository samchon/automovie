import type { IAutoMovieHumanBodyRegion } from "../IAutoMovieHumanBodyRegion";

/**
 * Foot chains of the f1 calibration specimen.
 *
 * Owned by the foot region's observation fitter. Empty until that region
 * is fitted; the torso region's own closure stands in meanwhile.
 */
export const AutoMovieHumanFootCalibration: IAutoMovieHumanBodyRegion = {
  name: "foot",
  chains: [],
  events: [],
  poles: [],
  trims: [],
};
