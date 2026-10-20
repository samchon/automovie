import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One decorative spray particle returned by sampleFluidSpray at the sampled step.
 *
 * buildFluidSprayObject copies position, size and ageRatio into Float32 point attributes. The stock PointsMaterial uses one fixed point size and opacity; a supplied shader must consume aSize/aAge for those particle values to affect appearance.
 *
 * @evidence contracts/common.md#principled-implementation sampleFluidSpray combines seeded spawn-index jitter and age time - index / rate into a closed-form ballistic position. Valid domain/state and representable index, direction and age arithmetic remain sampling premises; this record performs no admission.
 * @evidence contracts/common.md#clear-and-simple-design Emitter id and spawn index identify the sample, while position, size and ageRatio supply projection attributes; velocity and launch direction stay with sampling rather than being duplicated here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Size is copied from the emitter without age/distance scaling. Float32 projection may round values, and the default point material leaves per-particle size and age unused rather than implementing implicit fading.
 * @evidence contracts/common.md#meaningful-documentation Identifies producer, emitter-scoped spawn identity, ballistic metre position, size and age conventions, Float32 projection and default-material limitations.
 */
export interface IAutoMovieFluidSprayParticle {
  /** Id of the emitter that spawned it. */
  spray: string;

  /**
   * Zero-based spawn identity within the emitter, with launch time index / rate in domain-clock seconds. Extreme time/rate products must remain representable for distinct integer identities.
   */
  index: number;

  /** World position in metres at the sampled step, on its ballistic arc. */
  position: IAutoMovieVector3;

  /** World billboard size in metres, copied from the emitter. */
  size: number;

  /** Age divided by lifetime; the live-window rule targets [0, 1), without independently clamping or validating the resulting ratio. */
  ageRatio: number;
}
