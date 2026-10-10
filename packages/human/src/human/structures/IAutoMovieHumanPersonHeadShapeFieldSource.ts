import type { AutoMovieHumanPersonHeadShapeField } from "./AutoMovieHumanPersonHeadShapeField";

/**
 * One source-owned numerical trait's actual sampled endpoint conversion.
 * Authored support is a source envelope, not a clinical population normal.
 * Positive and negative units per weight are positive magnitudes; the source
 * channel's signed weight preserves the requested direction. The original
 * provider and endpoint replay own geometry and physical admission.
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
