/**
 * One source module's coverage: each function and each branch arm the module
 * holds, in source order, and whether the measured run reached it.
 *
 * A module the run never loaded lists its targets from its TypeScript source,
 * none reached; a loaded module lists them from the bundled JavaScript the run
 * executed. Two readings of one loaded module (two chunks or two processes)
 * list the same targets in the same order, so they merge arm by arm.
 */
export interface IModuleCoverage {
  /** The module's absolute file path, with forward slashes. */
  file: string;

  /** Whether the run loaded the module. */
  loaded: boolean;

  /** Every function with a body, in source order. */
  functions: IModuleCoverage.ITarget[];

  /** Every branch arm, in source order. */
  branches: IModuleCoverage.ITarget[];
}

/** Companion types of {@link IModuleCoverage}. */
export namespace IModuleCoverage {
  /** One function or branch arm. */
  export interface ITarget {
    /**
     * What it is: a function's qualified name, or a branch arm's kind after the
     * name of the function holding it. A module the run never loaded adds the
     * source line.
     */
    name: string;

    /** Whether the run reached it. */
    covered: boolean;
  }
}
