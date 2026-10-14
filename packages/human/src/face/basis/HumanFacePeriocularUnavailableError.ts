import type { IHumanFacePeriocularUnavailable } from "./IHumanFacePeriocularUnavailable";

/**
 * The named refusal of a periocular document field that cannot be built yet:
 * the producer-qualified registration it needs is absent from the basis.
 * Complete registrations reach the actual producers and their admission;
 * absent registrations refuse instead of being silently ignored.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation A named Error subtype carries the requested periocular field, absent producer registration and basis id rejected by assertHumanFacePeriocularAvailable.
 * @evidence contracts/common.md#clear-and-simple-design Standard Error message/name and structured detail serve human diagnostics and typed consumers without another refusal protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing actual registrations refuse by cause rather than asset-name substitution; complete registrations still require producer geometry/contact admission.
 * @evidence contracts/common.md#meaningful-documentation Prose states unavailable-field meaning and preserved detail; the supplied detail record is retained by reference.
 * @evidence contracts/performance.md#efficient-algorithms Error construction concatenates three diagnostic strings with storage proportional to their lengths, without mesh or registration scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Each refusal records its own field/cause; effectful Error instances and stack state are not cached across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The thrown error owns standard message/stack and retains the supplied detail until its consumer drops it; no task, geometry or external handle is acquired.
 */
export class HumanFacePeriocularUnavailableError extends Error {
  /** The field, the missing registration and the basis. */
  public readonly detail: IHumanFacePeriocularUnavailable;

  /**
   * @param detail The actual unavailable field/registration/basis, retained by reference.
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
