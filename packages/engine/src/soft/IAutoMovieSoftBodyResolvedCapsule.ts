import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One resolved capsule using the validation proxy's segment-and-radius meaning.
 * Endpoints are world metres from one absolute soft step; their geometry is
 * supplied by the wearable resolver rather than resampled by cloth integration.
 *
 * @evidence contracts/development/design.md#principled-representation Two resolved endpoints and a radius define the same segment-plus-ball proxy as body validation, keeping collision geometry separate from the rig that generated it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Stable capsule identity joins an authored body collider to its current geometry without embedding an actor pose or skeleton in the soft solver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Complete boundary admission checks authored identities and finite positive geometry, so an unresolved body capsule is not replaced by a generic sphere or origin segment.
 * @evidence contracts/development/common.md#meaningful-documentation States proxy meaning, world-metre endpoints, absolute-step provenance and stable source identity.
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
