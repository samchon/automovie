import type { IAutoMovieLoftSectionPhase } from "./IAutoMovieLoftSectionPhase";

/**
 * All local Cartesian partials through total order two in physical station and phase.
 *
 * Station s is measured in millimetres; phase is the inherited polar/correspondence angle in radians. These derivatives have already been converted from any root, angle or normalized interpolation coordinate. AutoMovieLoftSectionLegacy.jet requires a prepared jet variant and rejects unavailable or nonfinite requested derivatives; AutoMovieLoftSection returns the same shape for native and mixed fields. All six local vectors are fresh and mutable.
 *
 * @evidence contracts/development/design.md#principled-representation Extending the phase result adds exactly the physical station and mixed partials needed by the world frame product rule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Legacy, native and mixed readers publish this same physical-station/radian-phase jet for world lifting; a caller-mapped nonradian clock retains a separately documented WorldJetLocal contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Value-only preparation cannot be promoted by filling missing station rows; the producer throws instead.
 * @evidence contracts/development/common.md#meaningful-documentation States station versus phase coordinates, derivative units, local output ownership and admission owner.
 */
export type IAutoMovieLoftSectionJet = IAutoMovieLoftSectionPhase & {
  /** First physical-station partial of local [u,v], millimetres per millimetre. */
  s: [number, number];

  /** Second physical-station partial of local [u,v], inverse millimetres. */
  ss: [number, number];

  /** Mixed physical-station/phase partial of local [u,v], inverse radians. */
  st: [number, number];
};
