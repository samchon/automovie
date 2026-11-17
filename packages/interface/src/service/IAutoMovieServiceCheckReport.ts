/**
 * Capability statements emitted by serviceAnalysisSupport for one network.
 * Supported names a check the validator can perform, not a recorded successful
 * execution. Discipline-performance entries explicitly describe absent solvers.
 *
 * @evidence contracts/development/design.md#principled-representation Rule identity, supported status and explanation separate structural capability from a numerical verdict that the producer does not compute.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One plain row carries the service support report without adding pressure, voltage or hydraulic output fields no solver supplies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported disciplines remain explicit rows rather than implied passes; the record contains no validation-success boolean.
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer and distinguishes supported capability from executed admission, with stable identity and explanation documented per member.
 */
export interface IAutoMovieServiceCheckReport {
  /** Stable rule identity. */
  check: string;
  /**
   * supported when the engine has an applicable structural check for this
   * input; unsupported when the required geometry or numerical solver is absent.
   * This status does not record execution or a successful verdict.
   */
  status: "supported" | "unsupported";
  /** Why it is or is not answerable, naming what is missing when it is not. */
  reason: string;
}
