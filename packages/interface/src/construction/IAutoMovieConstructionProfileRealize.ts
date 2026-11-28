import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/** Profile leaf selected by the construction walk for source-backed realization. */
export namespace IAutoMovieConstructionProfileRealize {
  /**
   * Construction leaf that selects an original profile source registered for
   * this invocation. Its declaration must match that source's pure definition.
   * If preparation or append fails, realization restores its prior body state
   * and records a profile source diagnostic.
   */
  export type INode = IAutoMovieConstructionProfile & {
    /** Selects the profile-source leaf handler in the construction walk. */
    type: "profile";
  };
}
