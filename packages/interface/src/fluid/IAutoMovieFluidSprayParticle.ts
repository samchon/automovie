import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One decorative spray particle returned by sampleFluidSpray at the sampled
 * step.
 *
 * BuildFluidSprayObject copies position, size and ageRatio into Float32 point
 * attributes. The stock PointsMaterial uses one fixed point size and opacity; a
 * supplied shader must consume aSize/aAge for those particle values to affect
 * appearance.
 */
export interface IAutoMovieFluidSprayParticle {
  /** Id of the emitter that spawned it. */
  spray: string;

  /**
   * Zero-based spawn identity within the emitter, with launch time index / rate
   * in domain-clock seconds. Extreme time/rate products must remain
   * representable for distinct integer identities.
   */
  index: number;

  /** World position in metres at the sampled step, on its ballistic arc. */
  position: IAutoMovieVector3;

  /** World billboard size in metres, copied from the emitter. */
  size: number;

  /**
   * Age divided by lifetime; the live-window rule targets [0, 1), without
   * independently clamping or validating the resulting ratio.
   */
  ageRatio: number;
}
