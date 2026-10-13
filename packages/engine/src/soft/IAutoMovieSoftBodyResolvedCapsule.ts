import { IAutoMovieVector3 } from "@automovie/interface";
/**
 * One resolved capsule using the validation proxy's segment-and-radius meaning.
 * Endpoints are world metres from one absolute soft step; their geometry is
 * supplied by the wearable resolver rather than resampled by cloth integration.
 *
 * @evidence contracts/common.md#principled-implementation Two resolved endpoints and a radius define the same segment-plus-ball proxy as body validation, keeping collision geometry separate from the rig that generated it.
 * @evidence contracts/common.md#clear-and-simple-design Stable capsule identity joins an authored body collider to its current geometry without embedding an actor pose or skeleton in the soft solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete boundary admission checks authored identities and finite positive geometry, so an unresolved body capsule is not replaced by a generic sphere or origin segment.
 * @evidence contracts/common.md#meaningful-documentation States proxy meaning, world-metre endpoints, absolute-step provenance and stable source identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Capsule rows declare no nearest-segment or contact algorithm; collision projection belongs to the integration owner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A resolved proxy describes one step and owns no cross-frame geometry cache or equivalence claim.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The boundary owns two position records and primitive metadata; no source actor or bone collection is retained in this row.
 * @author Samchon
 */
export interface IAutoMovieSoftBodyResolvedCapsule {
  /** Stable source capsule identity. */
  id: string;

  /** First resolved segment endpoint. */
  from: IAutoMovieVector3;

  /** Second resolved segment endpoint. */
  to: IAutoMovieVector3;

  /** Shared proxy radius in metres. */
  radius: number;
}
