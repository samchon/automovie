import type { IAutoMovieHumanBodyRegion } from "../IAutoMovieHumanBodyRegion";

/**
 * Ear chains of the f1 calibration specimen.
 *
 * Owned by the ear region's observation fitter. Empty until that region
 * is fitted; the torso region's own closure stands in meanwhile.
 */
export const AutoMovieHumanEarCalibration: IAutoMovieHumanBodyRegion = {
  name: "ear",
  chains: [],
  events: [],
  poles: [],
  trims: [],
};
