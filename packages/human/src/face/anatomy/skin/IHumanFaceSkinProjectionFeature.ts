import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Affine nearest point on a native face, edge or vertex, expressed relative
 * to one guide's first point and divided by that guide's numerical scale.
 * Exact rational projections retain the native binary64 coordinates through
 * edge dot products and face Gram equations. The closed membership domain
 * rounds its exact endpoints once to the course's binary64 parameter format.
 *
 * @evidence contracts/common.md#principled-implementation An affine map and a closed validity interval express the closest point on one native face, edge or vertex.
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
export interface IHumanFaceSkinProjectionFeature {
  /** Actual native feature corners; coordinate-identical seam aliases are equivalent. */
  vertices: readonly number[];

  /** Projected position at guide parameter zero, in scaled local coordinates. */
  origin: readonly IHumanExactFraction[];

  /** Change per unit guide parameter, in scaled local coordinates. */
  velocity: readonly IHumanExactFraction[];

  /** First valid guide parameter. */
  lower: number;

  /** Last valid guide parameter. */
  upper: number;
}
