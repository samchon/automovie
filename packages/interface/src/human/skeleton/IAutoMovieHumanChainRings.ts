/**
 * One loft chain's skin sampled as rings: the fixed record of a body's skin
 * that the binding and the neutral posture read in place of the calibration.
 *
 * A ring is the chain's section at one station, evaluated at `phases` evenly
 * spaced phases from 0, so a ring of 48 holds every ring of 24, 12 or 4 as
 * each second, fourth or twelfth point. Phase 0 is the section's front and
 * phase 24 of 48 its back, so both lie on the median plane of a symmetric
 * section.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sampling, units and why the rings of coarser readers are subsets. One loft chain's skin sampled as rings: the fixed record of a body's skin that the binding and the neutral posture read in place of the calibration.
 * @evidence contracts/development/design.md#principled-representation `chain`: The loft chain's name, such as `trunk` or `leg.left`. `phases`: Phases per ring, evenly spaced over a full turn from phase 0. `stations`: The chain's stations, calibration millimetres of height, bottom first as the chain lists them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBindingInputs.rings. Read by AutoMovieHumanNeutral.derive, AutoMovieHumanNeutralHip.derive, AutoMovieHumanNeutralKnuckle.lines. Also types AutoMovieHumanBindingInputs.skin, AutoMovieHumanBindingInputs.neutralRings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chain`, `phases`, `stations`, `points`; callers supply the complete record.
 */
export interface IAutoMovieHumanChainRings {
  /** The loft chain's name, such as `trunk` or `leg.left`. */
  chain: string;

  /** Phases per ring, evenly spaced over a full turn from phase 0. */
  phases: number;

  /** The chain's stations, calibration millimetres of height, bottom first as the chain lists them. */
  stations: number[];

  /** Points, calibration millimetres, three numbers each, ring after ring in the order of `stations`. */
  points: number[];
}
