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
 * An original incidence identity paired with its exactly constructed material point.
 *
 * @evidence contracts/common.md#principled-implementation Keeping provenance separate from coordinates permits exact geometric predicates without proximity identity.
 * @evidence contracts/common.md#clear-and-simple-design A key and homogeneous point are the complete cut witness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original vertex or edge-pair provenance remains distinct from numerical position.
 * @evidence contracts/common.md#meaningful-documentation Explains why a cut retains both identity and location.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialCut witness does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialCut witness adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialCut witness does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions The point remains in the common dimensionless material frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialCut witness does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialCut witness carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialCut witness supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialCut witness defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialCut witness exposes no personal shaping input.
 * @author Samchon
 */
export interface IHumanFaceConformingMaterialCut {
  /** Original vertex or undirected edge-pair incidence. */
  key: string;

  /** Exact location, independently retained from its identity. */
  point: MaterialPoint;
}
