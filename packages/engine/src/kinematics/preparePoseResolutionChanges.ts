import type { IAutoMovieQuaternion } from "@automovie/interface";

import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";

/**
 * Track actual completed articulation changes on one immutable rooted rig.
 *
 * Nodes are the prepared producer's depth-first order, with each exclusive
 * subtree end fixed by that traversal. Only successfully admitted private
 * quaternions enter write; every input record is still admitted by its owner.
 * A completed query selects its final authored rotation or the actual fixed
 * baseline, then revises affected previously observed frames. A first frame
 * has no prior answer to invalidate and computes current selected ancestry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines genuine static DFS intervals, admitted quaternion inputs, final precedence/restoration, exact equality, first-demand observation, affected-frame revision meaning and operation lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation begin/write/complete select actual final admitted quaternions. A changed node affects its contiguous DFS subtree. observe registers a frame only after its actual first FK completes; absent frames have no previous result and compute current selected ancestry. Sorted merged changes therefore need revise only previously observed descendants, preserving later demand correctness without manufacturing admission.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns articulation membership and descendant invalidation only. preparePoseResolutionState owns numerical admission and FK, while prepareSkeletonPoseResolution owns actual rooted traversal. No parallel quaternion or hierarchy solver is introduced.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No caller boolean, pose identity, tolerance, target or sampled answer establishes validity. Every record reaches admission before write, including duplicates and stray names; final equality includes signed zero and absent edits restore the genuine baseline.
 * @evidence contracts/development/implementation.md#efficient-algorithms Writes and final membership comparison remain linear in admitted names. With W observed frames, C actual changes reuse one lazy bounded scratch array and sort only when W is nonzero and C exceeds one; each merged interval finds its first observation in O(log W) and revises A affected observations once. Full observation uses direct subtree traversal. First registration appends in order or inserts with O(W) shifts, bounded by B registrations. Admission-only/no-observation reads allocate no change list and perform no revision sorting/writes. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual private quaternion identity/exact components and completed membership establish changes. Observation records only prior FK demand, never admission: existing rows keep revisions across changing demands, while newly demanded rows compute actual current inputs. Duplicate intermediate records create no false final changes and failed authored scans never complete selection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure owns O(B) membership/final rotations and at most B observed indices/revisions. A change scratch array is allocated only after an observed frame actually changes; it is cleared before every completion and retains at most B indices, without preserving prior selections. Only genuine static nodes and private current/baseline values remain; no raw pose, edit, public output, query history or handle is retained. All state ends with the operation.
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
  const observed: number[] = [];
  let changed: number[] | undefined;
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
      if (changed !== undefined) changed.length = 0;
      for (const index of current)
        if (select(index, authored[index]!) && observed.length !== 0)
          (changed ??= []).push(index);
      for (const index of active)
        if (epochs[index] !== generation && select(index, baseline?.[index] ?? identity) &&
          observed.length !== 0)
          (changed ??= []).push(index);
      const previous: number[] = active;
      active = current;
      current = previous;
      if (changed === undefined || changed.length === 0) return;
      if (changed.length > 1)
        changed.sort((left: number, right: number): number => left - right);
      let covered: number = 0;
      for (const index of changed) {
        if (index < covered) continue;
        covered = nodes[index]!.subtreeEnd;
        if (observed.length === nodes.length) {
          for (let descendant: number = index; descendant < covered; ++descendant)
            revisions[descendant] = generation;
        } else {
          for (let ordinal: number = lowerBound(observed, index);
            ordinal < observed.length && observed[ordinal]! < covered; ++ordinal)
            revisions[observed[ordinal]!] = generation;
        }
      }
    },
    read: (index: number): IAutoMovieQuaternion =>
      selected[index] ?? baseline?.[index] ?? identity,
    revision: (index: number): number => revisions[index] ?? 0,
    observe: (index: number): void => {
      const known: number | undefined = revisions[index];
      if (known !== undefined) return;

      // Parent-first completion appends a newly demanded ancestry in order.
      // The actual frame used current selections; future changes watch it.
      if (observed.length === 0 || observed[observed.length - 1]! < index)
        observed.push(index);
      else observed.splice(lowerBound(observed, index), 0, index);
      revisions[index] = 0;
    },
  };

  /** Compare only completed final selections, after every authored record admitted. */
  function select(index: number, rotation: IAutoMovieQuaternion): boolean {
    const previous: IAutoMovieQuaternion = selected[index] ?? baseline?.[index] ?? identity;
    if (PoseResolutionSnapshot.sameQuaternion(previous, rotation)) return false;
    selected[index] = rotation;
    return true;
  }
}

/**
 * Internal actual-admission tracker borrowed only by prepared FK state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines query boundaries, successful authored writes, completion, selected private rotations and exact affected-subtree revisions.
 * @evidence contracts/development/design.md#principled-representation ITracker separates authored admission/selection from actual completed-frame observation and affected-descendant revision. Existing quaternion types own components; producer admission establishes valid rotations and the FK owner observes only an actually computed row, without a caller-provided validity flag.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one prepared FK owner needs begin/write/complete for ordered admission, read/revision for dependencies and observe after actual first FK. That completion seam preserves parent-first registration without repeated sorted insertion on a cold deep ancestry; no raw pose, target or external admission option enters it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape, body subset, editable whitelist, approximate equality, pose/time identity or external admission certificate is represented. An incomplete scan cannot replace the completed selection.
 */
export namespace preparePoseResolutionChanges {
  /** Actual private rotations and revisions for one live immutable-rig operation. */
  export interface ITracker {
    /** Start fresh membership without changing the last completed selection. */
    begin(): void;

    /** Record one actual admitted quaternion; later records of its index win. */
    write(index: number | undefined, rotation: IAutoMovieQuaternion): void;

    /** Select final current/baseline values and revise affected observed descendants. */
    complete(): void;

    /** Read the private completed local articulation, restoring baseline when absent. */
    read(index: number): IAutoMovieQuaternion;

    /** Read the last change affecting an observed frame, zero before its first computation. */
    revision(index: number): number;

    /** Register an actually completed first FK row in its parent-first completion order. */
    observe(index: number): void;
  }
}

/** Locate the first observed index in an actual changed DFS subtree. */
function lowerBound(values: readonly number[], target: number): number {
  let begin: number = 0;
  let end: number = values.length;
  while (begin < end) {
    const middle: number = begin + Math.floor((end - begin) / 2);
    if (values[middle]! < target) begin = middle + 1;
    else end = middle;
  }
  return begin;
}
