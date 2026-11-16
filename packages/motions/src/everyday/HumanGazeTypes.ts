import type { AutoMovieMotionTarget } from "@automovie/interface";

/**
 * Gaze recruitment, clinical shares and authored layer requests.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines recruitment, degree-valued yaw/pitch shares and film-second requests, with target resolution and numerical admission owned by the actual gaze evaluator.
 * @evidence contracts/development/design.md#principled-representation Keeps authored targets/times separate from computed clinical shares; yaw is positive left and pitch positive down in the performer's frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanGaze exposes these same three records through its existing public names; the split, aim and layer implementations are their actual consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface target union and preserves the existing recruitment alternatives, without another target representation, runtime validation or fitted pose data.
 */
export namespace HumanGazeTypes {
  /**
   * Which segments may join a gaze; auto follows the existing trunk policy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four alternatives and auto's existing meaning.
   * @evidence contracts/development/design.md#principled-representation A closed choice expresses which anatomical shares the gaze may recruit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These four values are read by split, aim and authored layer requests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No open string, body-specific alternative or inferred physical capability is introduced.
   */
  export type Recruit = "auto" | "eyes" | "head" | "trunk";

  /**
   * Gaze shares in degrees: yaw positive left, pitch positive down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines eye/head yaw and pitch plus trunk yaw, with their clinical degree signs.
   * @evidence contracts/development/design.md#principled-representation Separate eye, cervical and trunk shares preserve the evaluator's anatomical recruitment order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface split produces these existing fields; aim and layer timing consume them directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This record neither validates numeric angles nor certifies a target is reached; the gaze evaluator retains the existing range and residual policy.
   */
  export interface ISplit {
    /** Eye-in-head yaw and pitch at the end of the shift, degrees. */
    eyes: { yaw: number; pitch: number };

    /** Combined head/neck yaw and pitch, degrees. */
    head: { yaw: number; pitch: number };

    /** Trunk yaw, degrees. */
    trunk: number;
  }

  /**
   * One authored gaze request in a layer's declared time order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the target, start/optional return film seconds and optional recruitment, including omission meanings.
   * @evidence contracts/development/design.md#principled-representation A target and onset/return times describe the authored intention independently of sampled poses or numerical FK workspaces.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The existing layer constructor retains these requests and resolves only its active request during each apply call.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses AutoMovieMotionTarget unchanged; chronological order and valid times remain caller premises rather than a hidden sort or repair.
   */
  export interface ILayer {
    /** What to look at, resolved through the layer's context. */
    target: AutoMovieMotionTarget;

    /** Film second when the shift starts. */
    from: number;

    /** Film second when the gaze returns; omitted, it continues tracking. */
    to?: number;

    /** Which segments may join; auto when omitted. */
    with?: Recruit;
  }
}
