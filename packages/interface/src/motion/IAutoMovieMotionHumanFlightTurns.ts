import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";

/**
 * An airborne somersault and twist target in turns, with an optional launch
 * frame and angular-momentum bound. Performance flight planning solves the
 * momentum required by the requested turns.
 */
export interface IAutoMovieMotionHumanFlightTurns {
  /** The discriminator. */
  kind: "turns";

  /**
   * Somersault turns about the somersault axis, signed (positive tips the head
   * forward).
   */
  somersault: number;

  /**
   * Twist turns about the long axis, signed by the right-hand rule about the
   * body's up.
   */
  twist: number;

  /**
   * The somersault frame in the root's frame at take-off (a side salto turns it
   * a quarter about the long axis); the root's own axes when absent.
   */
  frame?: IAutoMovieQuaternion;

  /**
   * Under physical policy, the largest momentum the take-off can give, kg m²/s;
   * when absent, the flight pass derives it from the take-off's own momentum
   * and the centre's lever over the foot. Staged rotation makes no impulse or
   * conservation claim and does not use this physical ceiling.
   */
  maximum?: number;
}
