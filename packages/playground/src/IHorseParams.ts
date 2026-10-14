/**
 * Authored 8-dimension metre input for buildHorse's rigid quadruped document. All four legs point down at rest; humanoid arm names denote front legs, leg names denote hind legs and three little-finger slots form the tail. Neck/head offsets remain fixed at (0,0.34,0.26) and (0,0.12,0.2) metres; the spine attachment is consumed as the saddle by the existing rider pages. The shape accepts numbers without positivity, combination admission, measured species proportions or complete VRM normalization.
 *
 * @evidence contracts/common.md#principled-implementation Named scalar dimensions expose the existing closed-bone procedural representation without introducing a second skeleton vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design buildHorse is the only producer consuming these dimensions; ordinary page/viewer code owns FK, optional clamping and rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The authored proportions and enum reuse are a demonstration convention rather than veterinary measurements; invalid dimensions are not rejected by this type.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface executes no numerical algorithm; assembly and primitive costs belong to its builder.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased shape owns no cache or equivalent runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An erased shape acquires no handle or retained runtime resource.
 *
 * @author Samchon
 */
export interface IHorseParams {
  /** Height of the back line (withers/croup) off the floor. */
  backHeight: number;

  /** Hips → chest body length (the horizontal barrel). */
  trunkLength: number;

  /** Half the track width between the left/right legs. */
  legHalf: number;

  /** Upper-leg (shoulder/hip → knee) length. */
  upperLeg: number;

  /** Lower-leg (knee → hoof) length. */
  lowerLeg: number;

  /** Head sphere radius. */
  headRadius: number;

  /** Radius of a leg rod. */
  rodRadius: number;

  /** Radius of the barrel (spine) rods. */
  trunkRadius: number;
}
