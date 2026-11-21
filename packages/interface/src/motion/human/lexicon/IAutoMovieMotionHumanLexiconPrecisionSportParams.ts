import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Open parameters for the installed precision sport actions. Implement strokes bind an already held implement and a separate ball; bare-hand strokes strike the ball with the hand. The action planner admits the strike and publishes its launch only after measuring the fitted contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes prop custody and the planner that admits the requested stroke.
 * @evidence contracts/development/design.md#principled-representation Closed row map over a shared timed strike. The optional cue bridge is a distinct target on the playing surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each row exposes the same authored impact and shot controls. Cue strokes add support on the table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing target and side contracts. Runtime admission owns reach and geometric fit.
 */
export interface IAutoMovieMotionHumanLexiconPrecisionSportParams {
  /** Baseball hit on the scheduled pitch path. */
  baseballHit: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** Cricket front-foot drive after the delivery bounce. */
  cricketDrive: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

  /** A one-handed tennis racket stroke that returns the live ball. */
  tennisForehandReturn: IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke;

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
   * A timed bare-hand contact with a real scene ball and a separately
   * authored outgoing shot: the hand itself is the striking surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names ball custody, local strike seconds, world speed units and the striking hand.
   * @evidence contracts/development/design.md#principled-representation The row fixes the sport and the contact surface. The same impact event fixes both posture and ball launch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the ball, aim, impact time, outgoing speed and side; physical checks stay with the law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A ball's radius and center come from the prop's own sized grip. No implement is named because none is held.
   */
  export interface IHand {
    /** Subject id of the stationary or moving ball. */
    ball: string;

    /** The outgoing shot's horizontal direction, from the ball toward this target. */
    toward: IAutoMovieMotionTarget;

    /** Positive seconds from the action start to impact. Omit for the stroke's neutral timing. */
    impact?: number;

    /** Positive outgoing ball speed in metres per second. The row fixes the departure inclination. */
    speed: number;

    /** The striking hand. Defaults to right. */
    hand?: AutoMovieHumanSide;
  }
  /**
   * A timed contact with a real scene ball and a separately authored outgoing shot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names tool and ball custody, local strike seconds, and world speed units.
   * @evidence contracts/development/design.md#principled-representation The row fixes the sport and the contact affordance. The same impact event fixes both posture and ball launch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the bound equipment, side, aim, impact time and outgoing speed. Physical checks stay with the law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A ball's radius and center come from the prop's own sized grip. No duplicated world point is required for the strike.
   */
  export interface IStroke extends IHand {
    /** Subject id of the implement the striking hand already holds. */
    tool: string;
  }

  /**
   * A cue stroke with a fixed bridge contact read from the named table surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The bridge points to a fixed target for the guide hand during the stroke.
   * @evidence contracts/development/design.md#principled-representation Extends the shared timed strike with one distinct hand contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface No extra grip or bridge path is authored for the cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the canonical motion target rather than a private table coordinate type.
   */
  export interface ICue extends IStroke {
    /** Stable bed or rail point supporting the hand that guides the shaft. */
    bridge: IAutoMovieMotionTarget;
  }
}
