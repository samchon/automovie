import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Select the articulations of one admitted pose on a rooted rig, as numbers.
 *
 * A query begins, writes each successfully admitted articulation by its
 * bone's row, a later write of a row winning, and completes. Completion
 * selects, for every row, the query's last write or, for a row the query did
 * not write, the fixed baseline (the identity without one), and says whether
 * any selected component differs from the selection before, signed zeros
 * told apart. A query that does not complete (its admission threw) leaves
 * the last completed selection as it is.
 *
 * @param count The rig's rooted bones.
 * @param baseline The articulation a row no query writes is selected at, four numbers a row (x, y, z, w); the identity for every row when absent.
 * @returns The tracker.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the query's three phases, last-write precedence, baseline restoration, the exact comparison and what an incomplete query leaves.
 * @evidence contracts/development/implementation.md#principled-implementation A pose's records are sparse and the last record of a bone wins, so the selection is the last write per row and the baseline elsewhere; a frame depends on its row's and its ancestors' selections only, so one version of the whole selection tells a composed pose from a stale one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three numeric rows (the staged writes, the stamp of each row's last write and the selection) and one version. Admission stays with `preparePoseJointResolution`, composition with `composePoseFrames`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No caller flag, pose identity or tolerance decides a change: every component is compared exactly at completion, and a write outside the rig's rows is ignored as an unrooted name's was.
 * @evidence contracts/development/implementation.md#efficient-algorithms A write is four stores; completion is one pass over the rows with four exact comparisons each, no sorting, no per-frame revision and no allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work An unchanged selection keeps its version, so its composed frames are read again without composing.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns nine numbers a row and the borrowed baseline until its operation releases it; no record, pose or query history is kept.
 */
export function preparePoseResolutionChanges(
  count: number,
  baseline?: Float64Array,
): preparePoseResolutionChanges.ITracker {
  let generation: number = 0;
  let version: number = 0;
  const stamps: Float64Array = new Float64Array(count);
  const staged: Float64Array = new Float64Array(4 * count);
  const selected: Float64Array = new Float64Array(4 * count);
  if (baseline !== undefined) selected.set(baseline);
  else for (let index: number = 0; index < count; ++index) selected[4 * index + 3] = 1;
  return {
    selected,
    begin: (): void => {
      ++generation;
    },
    write: (index: number | undefined, rotation: IAutoMovieQuaternion): void => {
      if (index === undefined) return;
      const row: number = 4 * index;
      stamps[index] = generation;
      staged[row] = rotation.x;
      staged[row + 1] = rotation.y;
      staged[row + 2] = rotation.z;
      staged[row + 3] = rotation.w;
    },
    complete: (): void => {
      let changed: boolean = false;
      for (let index: number = 0; index < count; ++index) {
        const row: number = 4 * index;
        const written: boolean = stamps[index] === generation;
        for (let k: number = 0; k < 4; ++k) {
          const next: number = written
            ? staged[row + k]!
            : baseline !== undefined
              ? baseline[row + k]!
              : k === 3
                ? 1
                : 0;
          if (Object.is(selected[row + k], next)) continue;
          selected[row + k] = next;
          changed = true;
        }
      }
      if (changed) ++version;
    },
    version: (): number => version,
  };
}

/**
 * The tracker's type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its phase, its unit and what it leaves unchanged.
 * @evidence contracts/development/design.md#principled-representation The selection is the numeric row `composePoseFrames` reads; the three phases keep an authored scan apart from the completed selection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface begin/write serve the joint admission, complete/selected/version the prepared FK state; nothing else reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No raw pose, target or validity flag enters it, and an incomplete scan cannot replace the completed selection.
 */
export namespace preparePoseResolutionChanges {
  /** The selection of one live operation on an immutable rig. */
  export interface ITracker {
    /** The completed selection, four numbers a row (x, y, z, w): read after `complete`, never written by a reader. */
    readonly selected: Float64Array;

    /** Start a query's writes without changing the completed selection. */
    begin(): void;

    /** Record one admitted articulation; a later write of its row wins, and an undefined row is ignored. */
    write(index: number | undefined, rotation: IAutoMovieQuaternion): void;

    /** Select every row's last write of this query, or its baseline, and advance the version when any component changed. */
    complete(): void;

    /** The count of completions that changed the selection. */
    version(): number;
  }
}
