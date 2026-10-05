import type { IHumanFacePeriocularUnavailable } from "./IHumanFacePeriocularUnavailable";

/**
 * The named refusal of a periocular document field that its basis cannot
 * build yet, because the producer-qualified registration it needs is absent.
 *
 * @evidence contracts/common.md#principled-implementation A missing registration refuses by name instead of being guessed from asset names or shape.
 * @evidence contracts/common.md#clear-and-simple-design One error class for one refusal kind, with its record as a named member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raised only when the field is present and its registration absent; omission is unaffected.
 * @evidence contracts/common.md#meaningful-documentation States the message and detail roles.
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
export class HumanFacePeriocularUnavailableError extends Error {
  /** The field, the missing registration and the basis. */
  public readonly detail: IHumanFacePeriocularUnavailable;

  /**
   * @param detail The field, the missing registration and the basis.
   */
  public constructor(detail: IHumanFacePeriocularUnavailable) {
    super(
      "The face document field " + detail.field + " needs the basis's " +
        detail.missing + " registration, which basis " + detail.basis +
        " does not carry yet.",
    );
    this.name = "HumanFacePeriocularUnavailableError";
    this.detail = detail;
  }
}
