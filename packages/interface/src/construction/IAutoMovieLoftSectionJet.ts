import type { IAutoMovieLoftSectionPhase } from "./IAutoMovieLoftSectionPhase";

/**
 * Local [u, v] point and all partial derivatives through total order two.
 * Physical station is in millimetres and phase is in radians. The additional
 * fields give the first station partial, second station partial and mixed
 * station/phase partial. Native, legacy and mixed section readers return the
 * same shape after any coordinate conversion and before world placement.
 */
export type IAutoMovieLoftSectionJet = IAutoMovieLoftSectionPhase & {
  /** First physical-station partial of local [u,v], millimetres per millimetre. */
  s: [number, number];

  /** Second physical-station partial of local [u,v], inverse millimetres. */
  ss: [number, number];

  /** Mixed physical-station/phase partial of local [u,v], inverse radians. */
  st: [number, number];
};
