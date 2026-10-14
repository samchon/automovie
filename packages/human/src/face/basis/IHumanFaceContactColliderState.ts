import type { IHumanFaceContactGeometry } from "./IHumanFaceContactGeometry";

/**
 * Matched rest and performed geometry for one admitted contact collider.
 * Reach and cover retain their existing source-authored metre meanings.
 *
 * @evidence contracts/common.md#principled-implementation Matched shape-only and performed native sheets supply the original rest-clearance floor, capped by source cover and admitted only within readable reach.
 * @evidence contracts/common.md#clear-and-simple-design Source reach/cover accompany the two state queries so one contact owner retains their correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable rims or beyond-reach points supply no invented side/floor; cover and reach are authored constraints rather than measured tissue stiffness.
 * @evidence contracts/common.md#meaningful-documentation Members separate metre reach/cover and actual performed/rest geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type performs no contact solve; resolveHumanFaceContact owns query and correction work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record schedules no requests; each state hierarchy is shared across its actual soft vertices.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; the invocation owns both compiled sheets until contact completes.
 *
 * @author Samchon
 */
export interface IHumanFaceContactColliderState {
  /** Queryable distance from this oriented sheet, metres. */
  reach: number;

  /** Maximum retained rest-clearance floor, metres. */
  cover: number;

  /** Actual performed collider geometry. */
  now: IHumanFaceContactGeometry;

  /** Shape-only rest collider geometry. */
  rest: IHumanFaceContactGeometry;
}
