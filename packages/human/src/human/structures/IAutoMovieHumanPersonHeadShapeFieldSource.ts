import type { AutoMovieHumanPersonHeadShapeField } from "./AutoMovieHumanPersonHeadShapeField";

/**
 * One source-owned numerical trait's actual sampled endpoint conversion. Authored support is a source envelope, not a clinical population normal. Positive and negative units per weight are positive magnitudes; the source channel's signed weight preserves the requested direction. The original provider and endpoint replay own geometry and physical admission.
 *
 * @evidence contracts/common.md#principled-implementation Positive and negative unit magnitudes convert a signed trait request into one registered body-channel weight within that source's sampled endpoint envelope.
 * @evidence contracts/common.md#clear-and-simple-design The descriptor ties physical units, bounds, endpoint identity and provider qualification to the trait's single runtime channel owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored source support is explicitly distinct from clinical population norms, and public trait units cannot be reinterpreted by provider metadata.
 * @evidence contracts/common.md#meaningful-documentation Members define millimetres/degrees, positive scale magnitudes, signed support, nullable negative endpoint and geometric qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sampled trait-unit and signed endpoint registration specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the sampled trait-unit and signed endpoint registration; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sampled trait-unit and signed endpoint registration acquire no external resource or running task; their containing value owns ordinary data retention.
 *
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
