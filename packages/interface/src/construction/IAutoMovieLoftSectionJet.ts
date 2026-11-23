import type { IAutoMovieLoftSectionPhase } from "./IAutoMovieLoftSectionPhase";

/**
 * All local Cartesian partials through total order two in physical station and
 * phase.
 *
 * Station s is measured in millimetres; phase is the inherited
 * polar/correspondence angle in radians. These derivatives have already been
 * converted from any root, angle or normalized interpolation coordinate.
 * AutoMovieLoftSectionLegacy.jet requires a prepared jet variant and rejects
 * unavailable or nonfinite requested derivatives; AutoMovieLoftSection returns
 * the same shape for native and mixed fields. All six local vectors are fresh
 * and mutable.
 */
export type IAutoMovieLoftSectionJet = IAutoMovieLoftSectionPhase & {
  /** First physical-station partial of local [u,v], millimetres per millimetre. */
  s: [number, number];

  /** Second physical-station partial of local [u,v], inverse millimetres. */
  ss: [number, number];

  /** Mixed physical-station/phase partial of local [u,v], inverse radians. */
  st: [number, number];
};
