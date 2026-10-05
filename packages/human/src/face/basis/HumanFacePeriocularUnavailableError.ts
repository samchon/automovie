import type { IHumanFacePeriocularUnavailable } from "./IHumanFacePeriocularUnavailable";

/**
 * The named refusal of a periocular document field that cannot be built yet:
 * either the producer-qualified registration it needs is absent from the
 * basis, or the basis carries it but no shape producer turns the field into
 * geometry yet. The field is never accepted and silently ignored.
 *
 * @evidence contracts/common.md#principled-implementation A missing registration or shape producer refuses by name instead of being guessed from asset names or silently ignored.
 * @evidence contracts/common.md#clear-and-simple-design One error class for one refusal kind (an unbuildable periocular field), with its record as a named member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raised only when the field is present and cannot be built; omission is unaffected.
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
      detail.missing === "opticalSupport" || detail.missing === "periocular"
        ? "The face document field " +
            detail.field +
            " needs the basis's " +
            detail.missing +
            " registration, which basis " +
            detail.basis +
            " does not carry yet."
        : "The face document field " +
            detail.field +
            " cannot shape basis " +
            detail.basis +
            " yet: no " +
            (detail.missing === "opticalBuilder"
              ? "optical builder"
              : "lash generator") +
            " turns it into geometry, so it is refused rather than ignored.",
    );
    this.name = "HumanFacePeriocularUnavailableError";
    this.detail = detail;
  }
}
