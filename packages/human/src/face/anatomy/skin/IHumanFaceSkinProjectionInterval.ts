import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";

/**
 * One interval of the quadratic nearest-distance lower envelope. The chosen
 * feature supplies the affine point and never creates a new surface edge.
 *
 * @evidence contracts/common.md#principled-implementation The chosen feature and parameter interval preserve the native-supported pointwise minimum.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the geometric result or input owned by this declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native identity and explicit numerical units retain the source meaning without an anatomical default or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members document ownership, units and numerical distinctions needed by the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres remain public; dimensionless native feature parameters and explicit local scale are internal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry on an existing skin part and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing caller geometry or its reading and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no render primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Native continuity is checked by the compiled course owner, not certified by this transport type.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers own assembled skin observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric correspondence without a measured anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the relief and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal sculpting interface or clinical conversion.
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionInterval {
  /** Selected native feature. */
  feature: IHumanFaceSkinProjectionFeature;

  /** Interval start in [0,1]. */
  lower: number;

  /** Interval end in [0,1]. */
  upper: number;
}
