import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Inputs, results and layer settings for gaze planning.
 */
export namespace IAutoMovieMotionHumanGaze {
  /** Which segments a gaze may recruit. */
  export type Recruit = "auto" | "eyes" | "head" | "trunk";

  /** Which segments a gaze primitive may recruit. */
  export type HeadRecruit = "eyes" | "head";

  /**
   * What is looked at, as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The world point, metres.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieVector3;

  /** A gaze over a window. */
  export interface ILook {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** Which segments may join. */
    recruit: IAutoMovieMotionHumanGaze.HeadRecruit;

    /** Seconds since the action's start from which the head is written. */
    from: number;

    /** Seconds since the action's start until which the head is written. */
    to: number;

    /** What is looked at. */
    target: IAutoMovieMotionHumanGaze.Frame;

    /**
     * How far the eyes and the head have moved from where the posture has them
     * toward the target.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /**
   * A participant's gaze requests through a conversation. A gaze layer's
   * request.
   */
  export interface ILayer {
    /** What to look at, resolved through the layer's context. */
    target: IAutoMovieMotionTarget;

    /** Film second when the shift starts. */
    from: number;

    /** Film second when the gaze returns; omitted, it continues tracking. */
    to?: number;

    /** Which segments may join; auto when omitted. */
    with?: IAutoMovieMotionHumanGaze.Recruit;
  }

  /**
   * A split of one gaze direction, degrees: yaw positive toward the performer's
   * left, pitch positive down.
   */
  export interface ISplit {
    /** Eye-in-head yaw and pitch at the end of the shift, degrees. */
    eyes: {
      /** Yaw in degrees, positive toward the performer's left. */
      yaw: number;
      /** Pitch in degrees, positive downward. */
      pitch: number;
    };

    /** Combined head/neck yaw and pitch, degrees. */
    head: {
      /** Yaw in degrees, positive toward the performer's left. */
      yaw: number;
      /** Pitch in degrees, positive downward. */
      pitch: number;
    };

    /** Trunk yaw, degrees. */
    trunk: number;
  }

  /**
   * The direction of a world point from the eyes' midpoint, as yaw and pitch
   * about the posture's hips frame. Result returned by HumanGaze.direction. Yaw
   * (positive left) and pitch (positive down), degrees.
   */
  export type IDirectionResult = {
    /** Yaw in degrees, positive toward the performer's left. */
    yaw: number;
    /** Pitch in degrees, positive downward. */
    pitch: number;
  };

  /**
   * The posture with its gaze on a point: trunk and head blended toward their
   * shares by `weights`, then each eye solved exactly against the head it rides
   * and blended by its own weight. Input weights of HumanGaze.aim. How far each
   * part has moved toward its share, each in [0, 1].
   */
  export type IAimWeights = {
    /**
     * Progress in [0, 1] of the eyes toward its assigned share of the aimed
     * pose.
     */
    eyes: number;
    /**
     * Progress in [0, 1] of the head toward its assigned share of the aimed
     * pose.
     */
    head: number;
    /**
     * Progress in [0, 1] of the trunk toward its assigned share of the aimed
     * pose.
     */
    trunk: number;
  };
}
