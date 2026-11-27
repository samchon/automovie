import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * Open parameters for the installed precision sport actions. Implement strokes
 * bind an already held implement and a separate ball; bare-hand strokes strike
 * the ball with the hand. The action planner admits the strike and publishes
 * its launch only after measuring the fitted contact.
 */
export interface IAutoMovieMotionHumanLexiconPrecisionSportParams {
  /** Baseball hit on the scheduled pitch path. */
  baseballHit: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** Cricket front-foot drive after the delivery bounce. */
  cricketDrive: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A one-handed tennis racket stroke that returns the live ball. */
  tennisForehandReturn: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A one-handed table tennis forehand drive that returns the live ball. */
  tableTennisForehand: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A one-handed squash drive played off the front wall. */
  squashDrive: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A one-handed padel forehand that returns the live ball. */
  padelForehand: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A one-handed overhead badminton clear lifting the shuttle deep. */
  badmintonClear: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A two-handed field hockey hit along the ground. */
  fieldHockeyHit: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A full golf drive from a teed ball. */
  golfDrive: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A short golf chip with a lifted departure. */
  golfChip: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A short golf putt along the green. */
  golfPutt: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A forward cue stroke, with its bridge hand set on the table. */
  cueStroke: IAutoMovieMotionHumanLexiconPrecisionSportParams.ICue;

  /** A one-handed overhead volleyball serve struck from the palm. */
  volleyballServe: IAutoMovieMotionHumanLexiconPrecisionSportParams.IHand;

  /** An overhead volleyball set pushed high from the palm. */
  volleyballSet: IAutoMovieMotionHumanLexiconPrecisionSportParams.IHand;

  /** An overhead volleyball attack driven down from the palm. */
  volleyballSpike: IAutoMovieMotionHumanLexiconPrecisionSportParams.IHand;

  /** A low volleyball dig lifting the ball from the hand. */
  volleyballDig: IAutoMovieMotionHumanLexiconPrecisionSportParams.IHand;
}

/** Parameter types shared across the precision sport rows. */
export namespace IAutoMovieMotionHumanLexiconPrecisionSportParams {
  /**
   * A timed bare-hand contact with a real scene ball and a separately authored
   * outgoing shot: the hand itself is the striking surface.
   */
  export interface IHand {
    /** Subject id of the stationary or moving ball. */
    ball: string;

    /**
     * The outgoing shot's horizontal direction, from the ball toward this
     * target.
     */
    target: IAutoMovieMotionTarget;

    /**
     * Positive seconds from the action start to impact. Omit for the stroke's
     * neutral timing (the row's own, provisional).
     */
    impact?: number;

    /**
     * Positive outgoing ball speed in metres per second. The row fixes the
     * departure inclination. No natural value is defined: choose it for the
     * beat (provisional, missing).
     */
    speed: number;

    /** The striking hand. Defaults to right. */
    hand?: AutoMovieHumanSide;

    /**
     * A swinging miss: the stroke passes one ball's diameter under the ball at
     * the impact second, so it meets nothing and launches nothing, and the ball
     * flies on. Absent, the stroke meets the ball.
     */
    miss?: true;
  }
  /**
   * A timed contact with a real scene ball and a separately authored outgoing
   * shot.
   */
  export interface IStroke extends IHand {
    /** Subject id of the implement the striking hand already holds. */
    tool: string;
  }

  /** A cue stroke with a fixed bridge contact read from the named table surface. */
  export interface ICue extends IStroke {
    /** Stable bed or rail point supporting the hand that guides the shaft. */
    bridge: IAutoMovieMotionTarget;
  }
}
