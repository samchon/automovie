import type { IAutoMovieMotionHumanFlightMomentum } from "./IAutoMovieMotionHumanFlightMomentum";
import type { IAutoMovieMotionHumanFlightTurns } from "./IAutoMovieMotionHumanFlightTurns";

/**
 * A performer's airborne interval expressed as shares of the action's duration, with its angular-momentum or requested-turn specification. Performance flight planning resolves the declared rotation independently of evaluation order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A performer's airborne interval expressed as shares of the action's duration, with its angular-momentum or requested-turn specification. Performance flight planning resolves the declared rotation independently of evaluation order.
 * @evidence contracts/development/design.md#principled-representation from: Take-off, a share of the action's duration. to: Touchdown, a share of the action's duration, after `from`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action plans declare airborne windows and HumanPerformanceFlight resolves the whole-body rotation after action composition; momentum and turns are separately named alternatives.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Takeoff/touchdown remain duration shares. HumanPerformanceFlight converts that interval and owns flight solving; declaring the record alone does not certify a reachable turn count.
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
