import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * The lean of a standing body into a hand's work that lies beyond its standing
 * arm: the trunk tips about the hips by the least pitch that keeps the wrist
 * within a share of the arm's length, the hips moving back by the balance shift
 * of that pitch so the centre of mass stays over the feet where it stood, and
 * straightens as the work comes nearer.
 *
 * A person wiping the far side of a counter or pulling a drawer does not lock
 * the elbow: the trunk inclines as far as the hand needs and no further. Work
 * still out of reach at the lean's limit
 * (`AutoMovieMotionHumanReach.LEAN_LIMIT`) is refused, since it is walked up to
 * first.
 */
export namespace IAutoMovieMotionHumanLeanInto {
  /** What a lean is solved from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the body stands in before it leans. */
    standing: IAutoMovieMotionHumanPosture;

    /**
     * Whether the hips move back by the balance shift of the lean
     * (`IAutoMovieMotionHumanBalance`); absent or false, the trunk tips about
     * the hips where they stand and no centre of mass is computed.
     */
    balance?: boolean;

    /** The working hand. */
    side: AutoMovieHumanSide;

    /**
     * The share of the arm's length (upper arm and forearm) the wrist is kept
     * within.
     */
    share: number;

    /**
     * The most forward pitch the lean adds, degrees;
     * `AutoMovieMotionHumanReach.LEAN_LIMIT` when absent. A law raises it for
     * work below the hips, which a person stoops to.
     */
    limit?: number;

    /**
     * The wrist's goal on a posture at a progress of the stroke in [0, 1],
     * world metres.
     */
    wrist: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IAutoMovieVector3;

    /**
     * The working arm's goal on a posture at the stroke's start, so the balance
     * weighs the arm where it reaches; the arm as the posture holds it when
     * absent.
     */
    arm?: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal;

    /**
     * The refusal's message for a wrist left `beyond` metres out of reach at a
     * lean of `limit` degrees.
     */
    refuse: (beyond: number, limit: number) => string;
  }

  /** A solved lean. */
  export interface ILean {
    /**
     * The least pitch in degrees that reaches at a progress; throws the refusal
     * when the limit does not. Optional same-person FK is borrowed only by this
     * synchronous observation.
     */
    pitch: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
      resolution?: IAutoMoviePoseResolution.ISource,
    ) => number;

    /**
     * A posture tipped by a pitch in degrees, the hips shifted back to balance
     * it.
     */
    tip: (
      posture: IAutoMovieMotionHumanPosture,
      pitch: number,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * The primitive that leans in by `ready`, follows the stroke's progress and
     * straightens from `relax`.
     */
    primitive: (clock: IAutoMovieMotionClock) => IAutoMovieMotionHumanPrimitive;
  }
}
