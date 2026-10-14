import { IAutoMovieBeatEndState, IAutoMovieVideoEdit } from "@automovie/interface";
import type { IProductionShotAssemblyEntry } from "./IProductionShotAssemblyEntry";

/**
 * The immediately preceding placed shot with its optional admitted full-shot closing state. Placement and zero-based index remain the exact edit occurrence retained by the compiler.
 *
 * @evidence contracts/common.md#principled-implementation Strengthens an ordered entry to non-null occurrence fields and retains nullable closing so failed or unmeasured shots cannot invent continuity.
 * @evidence contracts/common.md#clear-and-simple-design The compilation coordinator keeps one preceding occurrence and the hard-cut predicate decides whether that state may feed the next source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A closing record does not establish adjacency, untrimmed playback or cut transitions by itself; the separate boundary predicate must admit all three.
 * @evidence contracts/common.md#meaningful-documentation States occurrence ownership, zero-based index, nullable measured state and the additional hard-cut eligibility gate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased occurrence shape performs no boundary calculation; fullHardCutBoundary owns clock conversion and adjacency work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type declares no continuity cache; the compilation coordinator retains the actual preceding occurrence and closing state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no resource; occurrence and beat-state references remain owned by the build attempt.
 * @author Samchon
 */
export interface ICompiledVideoClosing extends IProductionShotAssemblyEntry {
  /** The edit occurrence whose terminal state is retained. */
  placement: IAutoMovieVideoEdit;

  /** Position of the occurrence in the ordered video edit. */
  placementIndex: number;

  /** Resolved beat-end state, or null when the occurrence has none. */
  closing: IAutoMovieBeatEndState | null;
}
