/**
 * Identity and reference selection of one numerical body request.
 *
 * The basis names the neutral reference rig the inspector evaluates, not a
 * skin generated from the request's targets. The record carries no personal
 * mesh, centre or second shape document.
 *
 * @evidence contracts/common.md#principled-implementation Request identity and reference selection stay separate from the measured targets they accompany.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the anatomical document's anonymous identity extension.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stored geometry stands in for unresolved anatomy.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the reference basis from a generated person and states each field's role.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record identifies a request, not a generated anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Identity fields are not shaping channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record stores no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record introduces no spatial values.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The inspector's candidate model owns the displayed output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Identity and reference selection do not shape a person.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalRequestIdentity {
  /** Stable identity of this numerical request. */
  readonly id: string;

  /** Display label, independent of generator selection. */
  readonly name: string;

  /** Exact basis identity of the neutral reference rig used for inspection. */
  readonly basis: string;
}
