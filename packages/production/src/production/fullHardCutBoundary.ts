import type { IProductionShotAssemblyEntry } from "./IProductionShotAssemblyEntry";
import type { ICompiledVideoClosing } from "./ICompiledVideoClosing";
import { shotAssemblyResolvedFilmFrame } from "./shotAssemblyResolvedFilmFrame";

/**
 * Allow a preceding full-shot closing state only across adjacent placed hard cuts when the preceding source reaches its contract duration and the current source starts at frame zero.
 *
 * @evidence contracts/common.md#principled-implementation Exact placement-index adjacency and cut kinds combine with the shared tolerant frame conversion. Both previous duration and source-out must resolve to the same non-null frame count.
 * @evidence contracts/common.md#clear-and-simple-design This predicate owns continuity eligibility; the compilation coordinator separately decides whether a preceding closing state was successfully measured and may be passed forward.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unplaced rows, trims, non-cut transitions and unresolved clock values refuse inheritance instead of approximating a missing full-shot pose.
 * @evidence contracts/common.md#meaningful-documentation Documents zero-based occurrence adjacency, exclusive source-out versus full duration, zero source-in and separation between eligibility and successful closing measurement.
 * @evidence contracts/performance.md#efficient-algorithms At most three constant frame conversions and fixed field comparisons use constant work and space, independent of shot duration and performer count.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared conversion keeps all three clock readings consistent; no boundary result is reused across mutable placements or fps values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Contracts, placements and the previous closing record are borrowed without mutation; only a boolean escapes and no handle, task or continuity cache is owned.
 */
export const fullHardCutBoundary: (previous: ICompiledVideoClosing, current: IProductionShotAssemblyEntry, fps: number) => boolean = (
  previous: ICompiledVideoClosing,
  current: IProductionShotAssemblyEntry,
  fps: number,
): boolean => {
  if (current.placement === null || current.placementIndex === null)
    return false;
  const previousOut: number | null = shotAssemblyResolvedFilmFrame(previous.placement.sourceOut, fps);
  const previousDuration: number | null = shotAssemblyResolvedFilmFrame(
    { seconds: previous.contract.durationSeconds },
    fps,
  );
  return (
    current.placementIndex === previous.placementIndex + 1 &&
    previous.placement.transitionOut.kind === "cut" &&
    current.placement.transitionIn.kind === "cut" &&
    previousOut !== null &&
    previousOut === previousDuration &&
    shotAssemblyResolvedFilmFrame(current.placement.sourceIn, fps) === 0
  );
};
