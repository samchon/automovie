import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "./IAutoMovieMotionHumanSwordGuard";

/**
 * Swinging an implement at a ball: the bat and the racket share one cut timing
 * model (edge peak 6 to 10 m/s by skill).
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/** The parameter types of the Swing methods. */
export namespace IAutoMovieMotionHumanSwing {
  /** How many hands hold the implement: one or two. */
  export type Hands = 1 | 2;

  /**
   * A swing preset that fixes the line the cut comes from: the one-handed
   * racket strokes (forehand, backhand drive, topspin, overhead smash, volley)
   * and the volleyball spike. Spread into the cut's parameters; the composition
   * gives the rest.
   */
  export interface IStrokePreset {
    /** The line the cut comes from. */
    from: IAutoMovieMotionHumanSword.Line;
  }

  /**
   * A swing preset that fixes the line and the grip: the baseball swing, the
   * two-hand backhand, the golf swing and the putt.
   */
  export interface IGripPreset extends IStrokePreset {
    /** How many hands hold the implement. */
    hands: Hands;
  }

  /**
   * A swing preset that fixes the line, the grip and the withdrawn share: the
   * checked swing.
   */
  export interface ICheckPreset extends IGripPreset {
    /** The share of the stroke shown before it is withdrawn, in (0, 1). */
    feint: number;
  }

  /**
   * A swing preset that fixes the guard and the grip: the bunt, the bat held
   * level before the body.
   */
  export interface IBuntPreset {
    /** The guard held. */
    guard: IAutoMovieMotionHumanSwordGuard.Guard;

    /** How many hands hold the bat. */
    hands: Hands;
  }
}
