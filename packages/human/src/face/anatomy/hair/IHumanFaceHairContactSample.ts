import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The last closed-collider query a hair contact made, kept so that sampling the same coordinates again returns the identical hit without a new query.
 *
 * Reuse assumes the same deterministic collider and unchanged sampled coordinates. The point is an owned copy; callers must treat the shared hit as read-only. Its type and runtime object do not enforce that promise, so mutating a returned hit can corrupt a repeated sample.
 *
 * @evidence contracts/common.md#principled-implementation An owned queried-point copy paired with its deterministic signed hit makes consecutive identical-coordinate sampling reusable without caller mutation changing the key.
 * @evidence contracts/common.md#clear-and-simple-design Only the last point and hit are needed for this contact memo, so the record exposes neither an unbounded map nor a separate collider registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuse depends on the same query instance, actual point coordinates and caller respect for the shared hit; the hit is neither frozen nor defensively copied on return.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes owned key coordinates from the shared hit, states its unenforced read-only premise and limits reuse to consecutive equal coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The last-sample shape contains no search procedure; its contact owner compares three coordinates before deciding whether to query again.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Coordinate equality is sufficient within one deterministic collider closure; another surface's hit cannot be installed through this record's owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One cached point/hit is replaced by each new sample; it cannot accumulate a history of contact queries.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSample {
  /** Owned copy of the queried point. */
  point: IAutoMovieVector3;

  /** Shared query answer; callers must not mutate it because the memo can return the same object again. */
  hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;
}
