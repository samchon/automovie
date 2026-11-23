import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanLook } from "../everyday/IAutoMovieMotionHumanLook";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * An overlay: where the eyes and head look. It layers on any whole-body action.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanGaze<Chain> {
  /**
   * Standing and turning the eyes, head and trunk to a target, either at once
   * or, when cued by something seen or heard, after a seeded reaction time: the
   * orienting response of a bystander.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the head, and the trunk when the shift recruits it; it can be cut
   * into `stand`, `walk` and `look` at any share.
   *
   * @param params The `target`, `recruit`, `cue` and `duration` of
   *   `IAutoMovieMotionHumanLook.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  look(params: IAutoMovieMotionHumanLook.IParams, anchor?: string): Chain;
}

/**
 * Gaze as a goal: the eyes' lines brought onto a target, with the eyes, the
 * head and neck and the trunk recruited in that order as the target lies
 * farther from where the body faces.
 *
 * Gaze shifts recruit the eyes first and the head only beyond a threshold:
 * Freedman (2008, Exp Brain Res 190:369) reviews head-unrestrained gaze shifts
 * in which the head contributes little below about 15 to 20 degrees and an
 * increasing share beyond; Hollands, Ziavra and Bronstein (2004, Exp Brain Res
 * 154:261) find that large turns recruit the eyes, head, trunk and feet in that
 * order. The split here keeps the final eye-in-head eccentricity at most `EYES`
 * (15 degrees) on each axis, gives the head and neck the remainder up to `HEAD`
 * (provisional comfortable cervical share: 60 degrees of yaw, 40 down and 30
 * up, inside `DEFAULT_HUMANOID_ROM`), and, when the trunk may join, gives the
 * chest and lumbar spine the yaw beyond that up to `TRUNK` (40 degrees,
 * provisional, inside their combined twist range), 60 % to the chest and 40 %
 * to the spine. What none of these can hold stays on the eyes, clamped to their
 * range, so a gaze too far behind the body is visibly short; turning the feet
 * is the `look` action's step-turn.
 *
 * The head and neck angles come from the engine's `gazeChainJoints`, which
 * splits one aim over the neck and the head inside their ranges; the eyes are
 * then solved exactly: each eye's direction to the target is read in its head's
 * frame by forward kinematics of the trunk and head, and turned into the eye's
 * twist (yaw) and flexion (pitch), which compose as twist then flexion in the
 * default joint basis (`jointToQuaternion`), so the eye's forward meets the
 * target exactly within the eye's range.
 *
 * Timing: the eyes move on the saccadic main sequence, duration `2.2 A + 21`
 * milliseconds for an amplitude of `A` degrees (Bahill, Clark and Stark 1975,
 * Math Biosci 24:191; Carpenter 1988), and the head and trunk on a minimum-jerk
 * profile of `0.15 + 0.004 A` seconds (provisional: head movements are slower
 * than saccades and lengthen with amplitude, Zangemeister and Stark 1981; the
 * coefficients are unmeasured). Because the eyes are re-solved against the
 * moving head on every frame, they hold the target while the head catches up,
 * as the vestibulo-ocular reflex does, and a moving target is pursued.
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
