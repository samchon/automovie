/**
 * The actual sphere classification of one reported free-shaft intersection.
 * The crossing owner retains the strict intersection point and the root-ring
 * values that its existing predicate compared. These geometric observations
 * explain that predicate; they define no new insertion allowance or clinical
 * follicle dimension. Coordinates and distances are model metres, read from
 * the same Float32 meshes as the owning crossing witness.
 *
 * @evidence contracts/common.md#principled-implementation Retains the actual point, root sphere and point-to-centre distance that the crossing predicate compared, without substituting an authored radius.
 * @evidence contracts/common.md#clear-and-simple-design One named record carries the classification of its parent triangle-pair witness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds explanatory output only; the original sphere and strict comparison retain admission authority.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes geometric root-ring observations from an insertion allowance and clinical follicle measurements.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates and distances share the owning model's metre frame and its rounded source meshes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Identifies the already generated shaft without defining a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reports the existing root test without constructing a join.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical classification; the shaft owner observes the junction.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A represented mesh radius is not a biological follicle measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Carries the admission owner's existing comparison without defining another bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Contains measured output and no personal shaping control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConstructionRootInsertionWitness {
  /** Strict transverse point that the original predicate counted as free. */
  point: number[];

  /** Shaft ordinal whose root supplied the insertion test. */
  shaft: number;

  /** Mean of that shaft's actual represented root ring. */
  centre: number[];

  /** Maximum actual root-ring distance from its centre, metres. */
  radiusMetres: number;

  /** Point-to-root distance compared with that radius, metres. */
  distanceMetres: number;
}
