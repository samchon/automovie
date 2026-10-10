import type { IHumanFacePeriocularUnavailable } from "./IHumanFacePeriocularUnavailable";

/**
 * The named refusal of a periocular document field that cannot be built yet:
 * the producer-qualified registration it needs is absent from the basis.
 * Complete registrations reach the actual producers and their admission;
 * absent ones are never accepted and silently ignored.
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
      "The face document field " +
        detail.field +
        " needs the basis's " +
        detail.missing +
        " registration, which basis " +
        detail.basis +
        " does not carry yet.",
    );
    this.name = "HumanFacePeriocularUnavailableError";
    this.detail = detail;
  }
}
