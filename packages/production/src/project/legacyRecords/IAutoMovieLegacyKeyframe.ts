/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { AutoMovieEasing, IAutoMovieExpression, IAutoMoviePose } from "@automovie/interface";
import type { IAutoMovieLegacyBezier } from "./IAutoMovieLegacyBezier";

/**
 * JSON-safe keyframe the v1 store returned.
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyKeyframe {
  /**
   * Timestamp within the clip, seconds. Must be `<= clip duration`, and
   * keyframes must be strictly increasing in `time`; both enforced by the
   * engine's temporal verifier.
   */
  time: number;

  /**
   * The body pose held at this instant.
   */
  pose: IAutoMoviePose;

  /**
   * Facial expression at this instant, or `null` for the neutral (rest) face.
   * `null` is the unauthored/neutral side, blended toward like a resting joint
   * axis: an expression authored only at the far keyframe ramps in from neutral
   * across the segment, and one authored only at the near keyframe fades out.
   */
  expression: IAutoMovieExpression | null;

  /**
   * How to interpolate from this keyframe toward the next.
   */
  easing: AutoMovieEasing;

  /**
   * Control points for `easing: "cubicBezier"`, `null` for all other easings.
   * The engine's own keyframe carries these as the tuple `[x1, y1, x2, y2]`;
   * the LLM schema cannot express a tuple, so the v1 boundary names the four
   * numbers instead. Same values, same order.
   */
  bezier: IAutoMovieLegacyBezier | null;
}
