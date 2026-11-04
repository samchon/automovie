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
 * @evidence contracts/common.md#meaningful-documentation States the sampling, units and why the rings of coarser readers are subsets.
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
