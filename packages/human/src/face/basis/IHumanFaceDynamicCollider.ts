import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One generated collider's common rest and performed exterior.
 * The contact owner's existing source collider retains its reach and cover.
 *
 * @evidence contracts/common.md#principled-implementation Generated rest/performed exteriors replace the corresponding source collider while retaining that source's reach/cover and producer physical point identities where supplied.
 * @evidence contracts/common.md#clear-and-simple-design Two actual state meshes and optional diagnostic provenance describe replacement geometry without duplicating contact policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacement correspondence is an admitted producer premise; a missing point-id population supplies no invented provenance, and empty exterior replacement refuses at the consumer.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish optional diagnostic ids from rest/current gaze or jaw geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no collider compilation; resolveHumanFaceContact owns both native hierarchies.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; producers retain matching state correspondence and the contact owner shares compiled queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; generated mesh buffers belong to the pose and contact invocation.
 *
 * @author Samchon
 */
export interface IHumanFaceDynamicCollider {
  /** Exact generated part identity for query diagnostics; absent on legacy callers. */
  id?: string;

  /** Producer-owned physical identity of every query point, when its assembly supplies one. */
  pointIds?: readonly string[];

  /** Generated exterior before its owning eye or oral rigid motion. */
  rest: IAutoMovieMesh;

  /** The same exterior after its owner's performed gaze or jaw motion. */
  posed: IAutoMovieMesh;
}
