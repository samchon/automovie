import type { IAutoMovieQuaternion } from "@automovie/interface";

import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";

/**
 * Track actual completed articulation changes on one immutable rooted rig.
 *
 * Nodes are the prepared producer's depth-first order, with each exclusive
 * subtree end fixed by that traversal. Only successfully admitted private
 * quaternions enter write; every input record is still admitted by its owner.
 * A completed query selects its final authored rotation or the actual fixed
 * baseline, then revises exactly the affected descendant intervals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines genuine static DFS intervals, admitted private quaternion inputs, final-record precedence, absent-record restoration, exact component comparison, revision meaning and workspace lifetime. Companion methods below state their precise roles.
 * @evidence contracts/development/implementation.md#principled-implementation begin separates query membership, write records actual successful authored conversions in order and complete compares final selected quaternions with the last completed selection. A changed node affects precisely its contiguous DFS subtree; sorted overlapping intervals are applied once. read supplies that completed selection and revision supplies the latest actual affecting change.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns articulation membership and descendant invalidation only. preparePoseResolutionState owns numerical admission and FK, while prepareSkeletonPoseResolution owns actual rooted traversal. No parallel quaternion or hierarchy solver is introduced.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No caller boolean, pose identity, tolerance, target or sampled answer establishes validity. Every record reaches admission before write, including duplicates and stray names; final equality includes signed zero and absent edits restore the genuine baseline.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per query, admitted reachable records write in constant time. Completion compares current and formerly active names, sorts C actual changes in O(C log C), then revises A affected descendants once in O(A). Unchanged queries revise none; FK can check each requested frame's revision directly instead of walking unchanged ancestors. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static subtree intervals belong to the actual immutable rig. Actual private immutable quaternion identity or exact component equality and complete current membership determine equivalence; duplicate intermediate records never create false final changes. A previous incomplete or failed authored scan cannot become a completed selection, and baseline replacement requires a new workspace.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure owns O(B) current/previous membership, final quaternions and revisions, plus a temporary O(C) changed-index array. It retains only genuine static nodes, immutable baseline/identity operands and current private values, never raw poses, edits, outputs or history; all release with the operation reader.
 */
export function preparePoseResolutionChanges(
  nodes: readonly { subtreeEnd: number }[],
  identity: IAutoMovieQuaternion,
  baseline?: readonly (IAutoMovieQuaternion | undefined)[],
): preparePoseResolutionChanges.ITracker {
  let generation: number = 0;
  let active: number[] = [];
  let current: number[] = [];
  const epochs: number[] = [];
  const authored: (IAutoMovieQuaternion | undefined)[] = [];
  const selected: (IAutoMovieQuaternion | undefined)[] = [];
  const revisions: number[] = [];
  return {
    begin: (): void => {
      ++generation;
      current.length = 0;
    },
    write: (index: number | undefined, rotation: IAutoMovieQuaternion): void => {
      if (index === undefined) return;
      if (epochs[index] !== generation) current.push(index);
      epochs[index] = generation;
      authored[index] = rotation;
    },
    complete: (): void => {
      const changed: number[] = [];
      for (const index of current) select(index, authored[index]!, changed);
      for (const index of active)
        if (epochs[index] !== generation)
          select(index, baseline?.[index] ?? identity, changed);
      const previous: number[] = active;
      active = current;
      current = previous;
      changed.sort((left: number, right: number): number => left - right);
      let covered: number = 0;
      for (const index of changed) {
        if (index < covered) continue;
        covered = nodes[index]!.subtreeEnd;
        for (let descendant: number = index; descendant < covered; ++descendant)
          revisions[descendant] = generation;
      }
    },
    read: (index: number): IAutoMovieQuaternion =>
      selected[index] ?? baseline?.[index] ?? identity,
    revision: (index: number): number => revisions[index] ?? 0,
  };

  /** Compare only completed final selections, after every authored record admitted. */
  function select(index: number, rotation: IAutoMovieQuaternion, changed: number[]): void {
    const previous: IAutoMovieQuaternion = selected[index] ?? baseline?.[index] ?? identity;
    if (PoseResolutionSnapshot.sameQuaternion(previous, rotation)) return;
    selected[index] = rotation;
    changed.push(index);
  }
}

/**
 * Internal actual-admission tracker borrowed only by prepared FK state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines query boundaries, successful authored writes, completion, selected private rotations and exact affected-subtree revisions.
 * @evidence contracts/development/design.md#principled-representation ITracker separates an unfinished authored scan from a completed articulation selection and exposes the actual descendant-change revision used by FK. Existing quaternion types own numeric components; actual producer calls, rather than types or flags, establish admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one prepared FK owner needs begin/write/complete for ordered admission and read/revision for local and world dependencies. Raw poses, topology indices, baseline mutation and target results have no public seam here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape, body subset, editable whitelist, approximate equality, pose/time identity or external admission certificate is represented. An incomplete scan cannot replace the completed selection.
 */
export namespace preparePoseResolutionChanges {
  /** Actual private rotations and revisions for one live immutable-rig operation. */
  export interface ITracker {
    /** Start fresh membership without changing the last completed selection. */
    begin(): void;

    /** Record one actual admitted quaternion; later records of its index win. */
    write(index: number | undefined, rotation: IAutoMovieQuaternion): void;

    /** Select final current/baseline values and revise affected descendant intervals. */
    complete(): void;

    /** Read the private completed local articulation, restoring baseline when absent. */
    read(index: number): IAutoMovieQuaternion;

    /** Read the latest completed actual articulation change on this node's ancestry. */
    revision(index: number): number;
  }
}
