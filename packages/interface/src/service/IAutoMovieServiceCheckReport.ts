/**
 * Capability statements emitted by serviceAnalysisSupport for one network.
 * Supported names a check the validator can perform, not a recorded successful
 * execution. Discipline-performance entries explicitly describe absent
 * solvers.
 */
export interface IAutoMovieServiceCheckReport {
  /** Stable rule identity. */
  check: string;
  /**
   * Supported when the engine has an applicable structural check for this
   * input; unsupported when the required geometry or numerical solver is
   * absent. This status does not record execution or a successful verdict.
   */
  status: "supported" | "unsupported";
  /** Why it is or is not answerable, naming what is missing when it is not. */
  reason: string;
}
