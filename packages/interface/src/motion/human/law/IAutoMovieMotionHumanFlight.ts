import type { IAutoMovieMotionHumanFlightMomentum } from "./IAutoMovieMotionHumanFlightMomentum";
import type { IAutoMovieMotionHumanFlightTurns } from "./IAutoMovieMotionHumanFlightTurns";

/**
 * A performer's airborne interval expressed as shares of the action's duration, with its angular-momentum or requested-turn specification. Performance flight planning resolves the declared rotation independently of evaluation order.
 */
export interface IAutoMovieMotionHumanFlight {
  /** Take-off, a share of the action's duration. */
  from: number;

  /** Touchdown, a share of the action's duration, after `from`. */
  to: number;

  /**
   * The whole-body angular momentum about the centre of mass: given, world kg m²/s, or solved from the turns the flight must make (`solveAirborneTakeoff`).
   */
  momentum:
    | IAutoMovieMotionHumanFlightMomentum
    | IAutoMovieMotionHumanFlightTurns;
}
