/**
 * Renderer diffusion distances per linear RGB primary, in metres.
 * These radii are appearance parameters, not individually observed photon
 * paths or a calibrated measurement of personal tissue.
 *
 *
 * @evidence contracts/common.md#principled-implementation Three linear-primary distances represent renderer diffusion parameters in metres, separate from personal anatomical measurements.
 * @evidence contracts/common.md#clear-and-simple-design The renderer-facing record contains only r, g and b distances; HUMAN_SKIN_FINISH supplies the common source values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These appearance radii provide neither observed photon paths nor a calibrated personal-tissue measurement.
 * @evidence contracts/common.md#meaningful-documentation Each channel states metres and the introduction explicitly limits the physical interpretation of the radii.
 * @evidenceExclude contracts/performance.md#efficient-algorithms RGB scattering-distance declaration is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work RGB scattering-distance declaration specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources RGB scattering-distance declaration acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinScattering {
  /** Red primary, metres. */
  r: number;

  /** Green primary, metres. */
  g: number;

  /** Blue primary, metres. */
  b: number;
}
