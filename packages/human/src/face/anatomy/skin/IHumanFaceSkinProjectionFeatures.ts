import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";

/**
 * Native nearest-feature candidates for one guide chord. A single local scale
 * keeps triangle construction independent of tiny relief widths; reconstruct
 * head-frame positions as origin + scale * projected local position.
 *
 * @evidence contracts/common.md#principled-implementation Origin, positive scale and free direction make numerical normalization explicit while retaining native candidate identity.
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
export interface IHumanFaceSkinProjectionFeatures {
  /** Head-frame guide origin, metres. */
  origin: readonly number[];

  /** Positive coordinate normalization in metres. */
  scale: number;

  /** Free guide displacement in normalized coordinates. */
  direction: readonly IHumanExactFraction[];

  /** Actual vertex, edge and face candidates, in deterministic native order. */
  features: readonly IHumanFaceSkinProjectionFeature[];
}
