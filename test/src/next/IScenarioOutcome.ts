/** One scenario's verdict in the run's summary. */
export interface IScenarioOutcome {
  /**
   * The scenario's function name; a spec file's name without its extension when
   * the file failed before any scenario started.
   */
  name: string;

  /** Whether it passed. A stall, a crash or a failed load is a failure. */
  passed: boolean;
}
