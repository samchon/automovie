import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * Own reusable analytic-projector storage for one unchanged projector.
 * Each synchronous query borrows the idle primary workspace. A nested query
 * receives its own temporary workspace, so user clamps may reenter without
 * overwriting an outer query's candidates. Release removes every joint
 * reference and map entry before the next query can acquire the storage.
 * Returned selected joints and quaternion records never borrow these arrays.
 *
 * @returns Query acquisition and release for the projector that owns this closure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines projector ownership, synchronous query lifetime, reentrant isolation, reference clearing and independent selected outputs.
 * @evidence contracts/development/implementation.md#principled-implementation An exclusive synchronous lease permits numerical scratch reuse. Active recursion cannot borrow the primary lease; its temporary workspace follows the JavaScript call stack and is not pooled.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns only three existing analytic-search containers and their lease. The projector keeps candidate admission, composition, score ordering and result materialization.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate, clamp result, fitted answer or numerical score crosses queries. All original callbacks and physical work remain; no global pool, trust flag, input mutation or tolerance change is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms The ordinary query reuses two arrays and one numeric map instead of allocating them per projection. Clearing is O(C) for C candidates, as is the original search; nested queries allocate their own O(C) storage. End-to-end savings remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only empty scratch capacity is reused under the owning projector. Every query computes its actual admitted joints, raw quaternion components, bounds and tie distances anew, including queries after failure.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One projector retains empty primary containers with capacity bounded by the finite analytic candidate list. finally releases every acquired query on success or throw and removes all joint/map reachability; temporary nested containers release with their call and no history or handle remains.
 */
export function prepareJointProjectionScores(): {
  /** Borrow empty storage exclusively until the matching release. */
  acquire(): prepareJointProjectionScores.IWorkspace;
  /** Clear every query reference and return the primary lease when applicable. */
  release(workspace: prepareJointProjectionScores.IWorkspace): void;
} {
  const primary: prepareJointProjectionScores.IWorkspace = createWorkspace();
  let active: boolean = false;
  return {
    acquire: (): prepareJointProjectionScores.IWorkspace => {
      if (active) return createWorkspace();
      active = true;
      return primary;
    },
    release: (workspace: prepareJointProjectionScores.IWorkspace): void => {
      workspace.joints.length = 0;
      workspace.scores.length = 0;
      workspace.buckets.clear();
      if (workspace === primary) active = false;
    },
  };
}

/**
 * Numeric containers leased only to the analytic projector's synchronous query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names admitted joints, indexed score/raw-component cells and first-coordinate duplicate chains; the producer defines their empty-at-release lifetime.
 * @evidence contracts/development/design.md#principled-representation The workspace groups exactly the three existing search containers whose lifetime is one active analytic projection. It stores computation scratch rather than a pose or cross-query result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The owning projector is the only consumer and the helper is absent from the public barrel. No capacity control, pooling policy or numerical search option is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nested calls receive different containers and release clears references. The workspace cannot certify a source or candidate, replace a callback or turn prior results into current values.
 */
export namespace prepareJointProjectionScores {
  /** Three empty-on-release containers, with no source or query dependencies. */
  export interface IWorkspace {
    /** Current query's independent admitted joint records. */
    joints: IAutoMovieJointPose[];
    /** Existing indexed scalar score and raw-quaternion cells. */
    scores: number[];
    /** First-coordinate heads for exact clinical duplicate checking. */
    buckets: Map<number | null, number>;
  }
}

/** Allocate one unshared set of empty analytic-search containers. */
function createWorkspace(): prepareJointProjectionScores.IWorkspace {
  return { joints: [], scores: [], buckets: new Map<number | null, number>() };
}
