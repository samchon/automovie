/**
 * One exact-key skin point carried by its represented native triangle.
 * Parent IDs are canonical source samples, but their tuple order is the
 * original triangle corner order. Weights retain the reader's represented
 * values and engine multiply/add order; identity sorting never reorders them.
 * This is existing source correspondence, not a personal coordinate input.
 *
 * @evidence contracts/common.md#principled-implementation Exact identity and the actual represented interpolation travel together.
 * @evidence contracts/common.md#clear-and-simple-design One native parent tuple and coefficient tuple define the carried point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest point, fabricated vertex or normalized coefficient substitutes for the source seat.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes canonical sample IDs from their required interpolation order.
 * @evidence contracts/modeling.md#spatial-conventions Parents are dimensionless identities and weights are dimensionless; the consuming final skin supplies metre coordinates.
 * @evidence contracts/modeling.md#shared-boundaries Face and Person consume the same exact-key source seat.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries correspondence and emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The joined model owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Reads registered source support without deriving clinical anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and contact owners admit support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no personal point control.
 * @author Samchon
 */
export interface IHumanFaceMaterialAttachment {
  /** Actual native skin surface that owns these parents. */
  surface: string;

  /** Canonical sample IDs in the original native triangle corner order. */
  parents: readonly [number, number, number];

  /** Reader coefficients in that same order, without renormalization. */
  weights: readonly [number, number, number];

  /** Exact source-parent/weight identity that joins all aliases of this point. */
  identity: string;
}
