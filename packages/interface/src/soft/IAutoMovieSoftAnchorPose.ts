import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Static world target a named state assigns to one declared anchor.
 *
 * @evidence contracts/development/design.md#principled-representation softBodyRestBuffer maps these poses by anchor id and applies selected targets over static/rest coordinates before integration; static evaluation holds them, while supplied moving-boundary targets supersede them for bound anchors.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A reference and a vector express an override without repeating the anchor's particle index.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts validateSoftBodyDomain checks referenced anchors and duplicate overrides; this pose is not interpolated as an animation keyframe.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify the same-domain anchor and world-space target, distinguishing it from a moving local binding.
 */
export interface IAutoMovieSoftAnchorPose {
  /** Id of an anchor declared by the same domain. */
  anchor: string;

  /** World position that anchor holds in this state. */
  position: IAutoMovieVector3;
}
