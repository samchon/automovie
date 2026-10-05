/**
 * Why a periocular document field cannot be built on a basis.
 *
 * `field` is the document field that asked for it and `missing` the basis
 * registration that it needs and the basis lacks. `basis` is that basis's ID.
 *
 * @evidence contracts/common.md#principled-implementation Names the exact missing registration instead of approximating the part.
 * @evidence contracts/common.md#clear-and-simple-design Three named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports state; it changes no admission.
 * @evidence contracts/common.md#meaningful-documentation States each member's meaning.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names fields and registrations, not parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused document emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the refusal.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Reports a refusal, not a control.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularUnavailable {
  /** The document field that needs the registration. */
  field: "eyes" | "lashes.upper" | "lashes.lower";

  /** The basis registration the field needs. */
  missing: "opticalSupport" | "periocular";

  /** ID of the basis that lacks it. */
  basis: string;
}
