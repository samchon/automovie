import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 *
 * @evidence contracts/common.md#principled-implementation A positive denominator preserves determinant signs when coordinates are divided by it.
 * @evidence contracts/common.md#clear-and-simple-design Three integers carry one rational point without separate rounded coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tuple records an exact point and does not alias nearby samples.
 * @evidence contracts/common.md#meaningful-documentation States homogeneous denominator ownership rather than treating integer UV as metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialPoint witness does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialPoint witness adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialPoint witness does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates share the overlay's common dimensionless power-of-two unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialPoint witness does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialPoint witness carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialPoint witness supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialPoint witness defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialPoint witness exposes no personal shaping input.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * One material triangle, retaining construction and original-parent incidence,
 * exact coordinates and an exact common-unit bounding box.
 *
 * @evidence contracts/common.md#principled-implementation Exact integer points and their coordinate extrema permit conservative rejection without rounding a refined point's bounds inward.
 * @evidence contracts/common.md#clear-and-simple-design One record carries original incidence and its read-only rejection box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original corner IDs survive broad-phase preparation.
 * @evidence contracts/common.md#meaningful-documentation Explains why bounding coordinates cannot replace exact incidence predicates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialTriangle witness does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialTriangle witness adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialTriangle witness does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Points and bounds share the same dimensionless common integer material unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialTriangle witness does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialTriangle witness carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialTriangle witness supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialTriangle witness defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialTriangle witness exposes no personal shaping input.
 * @author Samchon
 */
export interface IHumanFaceConformingMaterialTriangle {
  /** Original source or canonical grid vertex IDs. */
  corners: [number, number, number];

  /** Canonical construction keys of those same corners. */
  keys: [string, string, string];

  /** Original domain triangle before material refinement; original triangles name themselves. */
  originalCorners: [number, number, number];

  /** Exact original coordinates; every denominator is one. */
  points: [MaterialPoint, MaterialPoint, MaterialPoint];

  /** Exact common-unit minima then maxima, used only for rejection. */
  bounds: [bigint, bigint, bigint, bigint];
}
