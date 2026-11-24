/**
 * One line of a scenario process's journal: a JSON object per line, appended
 * synchronously by the process that runs one spec file, so a line is on disk
 * before the next statement runs, even when that statement never returns or the
 * process dies. The runner reads the journal while the process runs and once it
 * has ended.
 */
export type IScenarioMark =
  | IScenarioMark.IStart
  | IScenarioMark.IComplete
  | IScenarioMark.IStall;

/** The marks a scenario process writes. */
export namespace IScenarioMark {
  /** A scenario's call is about to start. */
  export interface IStart {
    /** The mark's kind. */
    kind: "start";

    /** The scenario's function name. */
    name: string;

    /** When it was written, milliseconds since the Unix epoch. */
    at: number;
  }

  /** A scenario's call returned or threw, and its result was printed. */
  export interface IComplete {
    /** The mark's kind. */
    kind: "complete";

    /** The scenario's function name. */
    name: string;

    /** When it was written, milliseconds since the Unix epoch. */
    at: number;

    /** Whether it passed: no assertion error and a valid timing. */
    passed: boolean;
  }

  /**
   * The stall watch found the running work past the limit and is ending the
   * process.
   */
  export interface IStall {
    /** The mark's kind. */
    kind: "stall";

    /** The scenario's function name, or the spec file's import while it loads. */
    name: string;

    /** When it was written, milliseconds since the Unix epoch. */
    at: number;

    /** Seconds the work had run. */
    seconds: number;

    /**
     * The paused main thread's frames, innermost first; empty when the thread
     * could not be paused (blocked in native code).
     */
    stack: string[];
  }
}
