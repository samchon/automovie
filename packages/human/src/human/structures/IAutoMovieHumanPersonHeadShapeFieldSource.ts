import type { AutoMovieHumanPersonHeadShapeField } from "./AutoMovieHumanPersonHeadShapeField";

/**
 * One source-owned numerical trait's actual sampled endpoint conversion.
 * Authored support is a source envelope, not a clinical population normal.
 * Positive and negative units per weight are positive magnitudes; the source
 * channel's signed weight preserves the requested direction. The original
 * provider and endpoint replay own geometry and physical admission.
 *
 * @evidence contracts/common.md#principled-implementation Each direction names its actual sampled source endpoint and unit magnitude, so conversion requires no inferred geometry or copied body-driver equation.
 * @evidence contracts/common.md#clear-and-simple-design One trait record supplies identity, units, source bounds and a single body-channel owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No endpoint or biological norm is synthesized by this record.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes source support, signed weights and endpoint provenance.
 * @evidence contracts/modeling.md#spatial-conventions Units are millimetres or degrees in the provider's declared anatomical frame; weights are dimensionless.
 * @evidence contracts/anatomy.md#anatomical-source This registration reports source-authored support and sampled geometry; it makes no clinical or personal-reconstruction claim.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShapeFieldSource {
  /** Closed anatomical trait of this generation. */
  id: AutoMovieHumanPersonHeadShapeField;

  /** Public trait difference unit, checked by humanPersonHeadShapeFieldUnit; source metadata cannot reinterpret it. */
  unit: "mm" | "degree";

  /** Positive physical-source difference at channel weight +1. */
  positiveUnitsPerWeight: number;

  /** Positive magnitude of the physical-source difference at weight -1. */
  negativeUnitsPerWeight: number;

  /** Lowest signed source difference admitted by its authored envelope. */
  minimum: number;

  /** Highest signed source difference admitted by its authored envelope. */
  maximum: number;

  /** Single compiled body channel carrying this common-root source trait. */
  bodyChannel: string;

  /** Actual sampled endpoint of the positive source difference. */
  positiveEndpoint: string;

  /** Actual sampled endpoint of the negative source difference, or absent. */
  negativeEndpoint: string | null;

  /** Provider's geometric source/protocol qualification, independent of clinical observations. */
  qualification: string;
}
