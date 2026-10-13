/** What an analysis of this network can and cannot answer today. */
export interface IAutoMovieServiceCheckReport {
  /** Stable rule identity. */
  check: string;
  /**
   * `supported` when the engine really performs the check on this input;
   * `unsupported` when nothing here can perform it. A supported check that was
   * simply not executed is never reported as either.
   */
  status: "supported" | "unsupported";
  /** Why it is or is not answerable, naming what is missing when it is not. */
  reason: string;
}
