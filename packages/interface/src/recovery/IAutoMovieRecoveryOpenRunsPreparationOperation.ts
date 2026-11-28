import type {
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
} from "..";
import type { IAutoMovieRecoveryOpenContinuationEdge } from "./IAutoMovieRecoveryOpenContinuationEdge";

/** Callable preparation of ordinary open-run connectivity. */

export namespace IAutoMovieRecoveryOpenRunsPreparationOperation {
  /**
   * Select quadratic or ruled interpolation with a positive recorded physical
   * tolerance, then verify that every saved open arc is accounted for in each
   * adjacent interval. Return directional maps and exact unsupported group
   * counts.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    graph: IAutoMovieRecoveryOpenContinuation,
    operator: "quadratic" | "ruled",
  ) => {
    /** Ordinary links keyed by earlier saved station and open arc. */
    outgoing: Map<string, IAutoMovieRecoveryOpenContinuationEdge>;

    /** Ordinary links keyed by later saved station and open arc. */
    incoming: Map<string, IAutoMovieRecoveryOpenContinuationEdge>;

    /** Number of ordinary saved links admitted into both maps. */
    pairs: number;

    /** Total unresolved groups preserved across the verified adjacent intervals. */
    unsupportedGroups: number;

    /**
     * Unresolved group count restricted to groups with at least one saved open
     * arc.
     */
    unsupportedGroupsWithOpenArcs: number;
  };
}
