import type { IAutoMovieHumanPostureRotation } from "../posture/IAutoMovieHumanPostureRotation";
import type { IAutoMovieMotionHumanFlightMomentum } from "./IAutoMovieMotionHumanFlightMomentum";
import type { IAutoMovieMotionHumanFlightTurns } from "./IAutoMovieMotionHumanFlightTurns";

/**
 * A performer's airborne interval expressed as shares of the action's duration,
 * with its angular-momentum or requested-turn specification. Performance flight
 * planning resolves the declared rotation independently of evaluation order.
 */
export interface IAutoMovieMotionHumanFlight {
  /** Take-off, a share of the action's duration. */
  from: number;

  /** Touchdown, a share of the action's duration, after `from`. */
  to: number;

  /**
   * The whole-body angular momentum about the centre of mass: given, world kg
   * m²/s, or solved from the turns the flight must make
   * (`AutoMovieEngineMotionAirborneTakeoff`).
   */
  momentum:
    | IAutoMovieMotionHumanFlightMomentum
    | IAutoMovieMotionHumanFlightTurns;

  /**
   * What the landing requires of the rotation the flight hands back, when the
   * action that declares the flight lands on a known geometry. Absent, the
   * landing takes the flight's rotation as it comes.
   */
  touchdown?: IAutoMovieMotionHumanFlight.ITouchdown;
}
export namespace IAutoMovieMotionHumanFlight {
  /**
   * The landing's requirement on the handed-back rotation: whether the ground
   * phase already adopts the terminal yaw, how far the physical shooting may
   * miss, and the check of the rotation actually received.
   */
  export interface ITouchdown {
    /** Whether the ground phase already adopts the terminal yaw. */
    turnedLanding: boolean;

    /**
     * Physical shooting residual limit in radians, derived from the
     * displacement budget.
     */
    angularTolerance: number;

    /**
     * Verify the actual rigid rotation received from the flight pass.
     *
     * @param rotation The rotation the flight hands back.
     */
    check(rotation: IAutoMovieHumanPostureRotation): void;
  }
}
