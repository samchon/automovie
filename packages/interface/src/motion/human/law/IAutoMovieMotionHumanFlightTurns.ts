import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";

/**
 * An airborne somersault and twist target in turns, with an optional launch frame and angular-momentum bound. Performance flight planning solves the momentum required by the requested turns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An airborne somersault and twist target in turns, with an optional launch frame and angular-momentum bound. Performance flight planning solves the momentum required by the requested turns.
 * @evidence contracts/development/design.md#principled-representation somersault: Somersault turns about the somersault axis, signed (positive tips the head forward). frame: The somersault frame in the root's frame at take-off (a side salto turns it a quarter about the long axis); the root's own axes when absent. maximum: The largest momentum the take-off can give, kg m²/s; when absent, the flight pass derives it from the take-off's own momentum and the centre's lever over the foot (`HumanPerformanceFlight`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action plans provide turn targets to HumanPerformanceFlight, which calls the engine takeoff solver; the target record does not carry that solver's internal state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Signed somersault/twist turns, the root-relative takeoff frame and the physical momentum maximum remain explicit. The runtime derives an omitted maximum and owns infeasible-target refusal.
 */
export interface IAutoMovieMotionHumanFlightTurns {
  /** The discriminator. */
  kind: "turns";

  /** Somersault turns about the somersault axis, signed (positive tips the head forward). */
  somersault: number;

  /** Twist turns about the long axis, signed by the right-hand rule about the body's up. */
  twist: number;

  /** The somersault frame in the root's frame at take-off (a side salto turns it a quarter about the long axis); the root's own axes when absent. */
  frame?: IAutoMovieQuaternion;

  /** The largest momentum the take-off can give, kg m²/s; when absent, the flight pass derives it from the take-off's own momentum and the centre's lever over the foot (`HumanPerformanceFlight`). */
  maximum?: number;
}
