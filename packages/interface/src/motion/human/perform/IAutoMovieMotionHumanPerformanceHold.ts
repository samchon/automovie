import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/** Contracts used by HumanPerformanceHold.prop. */
export namespace IAutoMovieMotionHumanPerformanceHold {
  /**
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`). Input
   * own of HumanPerformanceHold.prop. The performer reading the prop and their
   * own bones, for a prop they may carry.
   */
  export type IPropOwn = {
    /**
     * Scene subject id of the performer querying the prop, which may be carried
     * by that performer.
     */
    subject: string;
    /**
     * Synchronous accessor for that performer's currently resolved bones, at
     * least those `requested` (every bone when absent); the returned map is
     * borrowed and must remain stable for the current query. Failures propagate
     * to hold resolution.
     */
    bones: (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  };
}
