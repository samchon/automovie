import { HUMAN_SKIN_FINISH } from "../../common/skin/HUMAN_SKIN_FINISH";

/**
 * Legacy neck-join material and sampled rig conventions. Seam reaches derive
 * from the supplied source geometry and weights unless explicitly overridden
 * in metres. These constants neither measure physiology nor certify final
 * geometry or current rendered appearance.
 *
 * - `skinMaterial` is the material id both bases give their skin. The seam
 *   finds each anatomy's skin surface as the surface that draws it.
 * - `neckShare` is the cumulative vertex-count threshold for source samples
 *   whose dominant bone is neck or head. Sorted triangle-edge graph distances
 *   return the first sample where that share falls below 0.5, or the last
 *   reachable sample if it never does (`measureHumanNeckReach`). This is a
 *   tessellation-dependent rig convention, not measured anatomical extent.
 * - `headShare` selects the first sorted graph distance containing 0.95 of
 *   sampled head-weight mass strictly inside the neck reach. Uniform source
 *   vertex sampling is not surface-area weighting. The resulting metre reach
 *   is used as the face height interval for collar-to-head weight blending
 *   (`measureHumanHeadReach`, `createHumanPersonFaceSkin`).
 * - `jawShare` selects face mandible-attachment rows strictly above 0.5 for
 *   head-only skin weights regardless of height above the cut. This rig
 *   convention leaves any position-dependent head twist with the skin owner
 *   and supplies no independent chin/contact guarantee.
 * - `fairRings` is how many edge rings on each side of the seam the shading
 *   normals are blended over (five; their metre extent depends on sampling),
 *   using the existing ring-weighted Jacobi sweeps (`fairHumanSeamNormals`).
 *   It changes shading only.
 * - `radialGuard` bounds, as a multiple of the body loop's greatest distance
 *   from the neck axis, which vertices the covered band may take: only skin
 *   close to the neck can pass this radial part of the sampled overlap test.
 *   A raised arm inside that radius can still pass; this guard is neither
 *   anatomical classification nor a collision guarantee.
 *
 * @author Samchon
 */
export const HUMAN_PERSON_SEAM: {
  readonly skinMaterial: typeof HUMAN_SKIN_FINISH.material;
  readonly neckShare: 0.5;
  readonly headShare: 0.95;
  readonly jawShare: 0.5;
  readonly fairRings: 5;
  readonly radialGuard: 1.5;
} = {
  skinMaterial: HUMAN_SKIN_FINISH.material,
  neckShare: 0.5,
  headShare: 0.95,
  jawShare: 0.5,
  fairRings: 5,
  radialGuard: 1.5,
} as const;
