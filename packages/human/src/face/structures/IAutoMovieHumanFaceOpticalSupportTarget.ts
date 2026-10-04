/**
 * Regenerated witness of one nonzero source endpoint on one eye component.
 *
 * Only movements the producer actually regenerated are enrolled. A relevant
 * nonzero target without a witness is refused; zero-effect endpoints are
 * checked directly instead.
 *
 * @evidence contracts/common.md#principled-implementation Stores the exact sparse rows the producer regenerated so the consumer compares rather than infers movement.
 * @evidence contracts/common.md#clear-and-simple-design Three named fields replace an anonymous array element type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raw control ID or inferred movement stands in for a witness.
 * @evidence contracts/common.md#meaningful-documentation States enrollment, refusal and the row layouts.
 * @evidence contracts/modeling.md#spatial-conventions Displacements are head-frame metres in sparse (index, dx, dy, dz) rows.
 * @evidenceExclude contracts/modeling.md#parameter-channels Names an existing endpoint; defines no control.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source authoring correspondence, not a clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Introduces no bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A witness, not a control.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportTarget {
  /** Existing endpoint identity from the basis target domain. */
  id: string;
  /** Exact native sparse (vertex, dx, dy, dz) rows for this component. */
  surfaceRows: number[];
  /** Exact sparse landmark rows for the named eye's rigid centre landmark. */
  pivotRows: number[];
}
