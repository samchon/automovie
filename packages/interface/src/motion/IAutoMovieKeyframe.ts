import { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import { IAutoMoviePose } from "../pose/IAutoMoviePose";
import { AutoMovieEasing } from "./AutoMovieEasing";

/**
 * A single keyframe: a pose (and optional expression) pinned at a timestamp, plus the easing into the _next_ keyframe.
 *
 * A keyframe is just a static {@link IAutoMoviePose} stamped with a `time` and a blend curve, so everything that validates a pose (ROM, joint conflicts) validates a keyframe for free, and the temporal layer only adds ordering and rate checks on top.
 *
 * @evidence contracts/common.md#principled-implementation A keyframe stamps one static pose and optional expression with clip-local seconds; sampleMotion interpolates from this frame with its outgoing easing, treating absent expression channels as neutral, and validateMotion checks the static and temporal domains together.
 * @evidence contracts/common.md#clear-and-simple-design Pose and expression retain their own structures while time, easing and cubic controls add only segment information; the surrounding motion owns rig identity, duration and looping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null expression interpolates from neutral rather than snapping an authored far expression into the whole segment; cubic controls are required only for their curve and stray controls on other curves are refused.
 * @evidence contracts/common.md#meaningful-documentation Defines outgoing easing, finite ordered beat-independent seconds, neutral-expression fades, cubic control ordering and the monotone-time x bounds with unconstrained finite y overshoot.
 */
export interface IAutoMovieKeyframe {
  /**
   * Finite timestamp within `[0, clip duration]`, in seconds, and keyframes must be strictly increasing in `time`; both enforced by the engine's temporal verifier.
   */
  time: number;

  /** The body pose held at this instant. */
  pose: IAutoMoviePose;

  /**
   * Facial expression at this instant, or `null` for the neutral (rest) face. `null` is the unauthored/neutral side, blended toward like a resting joint axis: an expression authored only at the far keyframe ramps in from neutral across the segment (it does not pop to full at the segment start), and one authored only at the near keyframe fades back out to neutral.
   */
  expression: IAutoMovieExpression | null;

  /** How to interpolate from this keyframe toward the next. */
  easing: AutoMovieEasing;

  /**
   * Controls for cubicBezier as `[x1, y1, x2, y2]`: x values in `[0, 1]` keep time monotone; finite y values may overshoot. Null for other easings.
   */
  bezier: [number, number, number, number] | null;
}
