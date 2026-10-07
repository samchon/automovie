/** One retained AO result for its geometric pose and actual opaque population.
 *
 * @evidence contracts/common.md#principled-implementation Retains pose and composed opaque-material population that jointly identify bake geometry and classification inputs.
 * @evidence contracts/common.md#clear-and-simple-design One record owns one previous bake with its two invalidation keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores actual bake bindings rather than predicted or subject-specific images.
 * @evidence contracts/common.md#meaningful-documentation States map ownership and distinguishes geometric and classification keys.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports computational inputs and defines no form-varying channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no joined surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the assembled consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Establishes no anatomical quantity or physiological source.
 * @evidenceExclude contracts/anatomy.md#permitted-range Owns no physiological range; anatomical admission remains with its input owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no public measurement or physiological control for shaping a person.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity or conversion.
 * @author Samchon
 */
export interface IHumanFaceOcclusionCacheEntry {
  /** Read-only geometric pose identity supplied by the same builder. */
  pose: object;

  /** Sorted opaque material IDs actually used by mesh occluders. */
  opaqueMaterials: string;

  /** Owned baked image bindings; callers receive a separate map. */
  images: ReadonlyMap<string, string>;
}
