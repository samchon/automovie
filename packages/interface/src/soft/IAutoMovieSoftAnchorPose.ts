import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Static world target a named state assigns to one declared anchor.
 *
 * @evidence contracts/common.md#principled-implementation restConfiguration maps these poses by anchor id and writes the selected world target before integrating; the state is held for the complete seek.
 * @evidence contracts/common.md#clear-and-simple-design A reference and a vector express an override without repeating the anchor's particle index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts validateSoftBodyDomain checks referenced anchors and duplicate overrides; this pose is not interpolated as an animation keyframe.
 * @evidence contracts/common.md#meaningful-documentation Members identify the same-domain anchor and world-space target, distinguishing it from a moving local binding.
 * @author Samchon
 */
export interface IAutoMovieSoftAnchorPose {
  /** Id of an anchor declared by the same domain. */
  anchor: string;

  /** World position that anchor holds in this state. */
  position: IAutoMovieVector3;
}
