/**
 * One sparse anchored displacement row of a compiled facial closure endpoint.
 * The transition vertex moves by the coefficient-weighted sum of its contact
 * drivers' closure displacements, axis by axis, in the performed head frame.
 * The vertex is not itself a contact point, owns at most one row, and each
 * driver is a registered contact point appearing once with a positive weight.
 *
 * @evidence contracts/common.md#principled-implementation Registered contact drivers and positive offline coefficients define the transition displacement; no runtime tissue solve or normalization replaces them.
 * @evidence contracts/common.md#clear-and-simple-design One named vertex-and-drivers row replaces the anonymous closure-plan entry read by the closure consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source identities and coefficients are compiled data with no personal coordinates, neck index mask or coefficient repair.
 * @evidence contracts/common.md#meaningful-documentation States the displacement formula, the vertex and driver domains, uniqueness and the coefficient sign.
 * @evidence contracts/modeling.md#shared-boundaries Transition vertices follow the shared closure endpoint of their registered contact drivers after posing.
 * @evidence contracts/modeling.md#spatial-conventions IDs and coefficients are dimensionless; displacements stay in the consumer's common performed metre/head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A displacement row defines no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled shared-source data defines no person authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The row moves an existing vertex; the compiler owns the vertex and cell population.
 * @evidenceExclude contracts/modeling.md#rendered-observation The row displays nothing; source compiler and face assembly observe the resulting geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Offline coefficients define arithmetic, not measured tissue or a biological law.
 * @evidenceExclude contracts/anatomy.md#permitted-range Positive coefficients are an arithmetic domain, not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The row introduces no personal vertex, curve or sculpt input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSourceClosureRow {
  /** Performed source vertex receiving the displacement, never a contact point. */
  readonly vertex: number;

  /** Unique [contact driver vertex, positive dimensionless weight] pairs. */
  readonly coefficients: readonly (readonly [number, number])[];
}
