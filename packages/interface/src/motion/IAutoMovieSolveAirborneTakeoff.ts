import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieIntegrateAirborneRotation } from "./IAutoMovieIntegrateAirborneRotation";
import type { IAutoMovieIntegrateMotionTrajectory } from "./IAutoMovieIntegrateMotionTrajectory";

/**
 * Data and callback contracts shared by the SolveAirborneTakeoff operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieSolveAirborneTakeoff contracts used by packages/engine/src/motion/solveAirborneTakeoff.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSolveAirborneTakeoff contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieSolveAirborneTakeoff {
  /**
   * What a take-off is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieSolveAirborneTakeoff.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSolveAirborneTakeoff.IProps contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IProps {
    /** The shape's history (`integrateAirborneRotation.history`). */
    history: IAutoMovieIntegrateAirborneRotation.IHistory;

    /** Take-off, seconds. */
    t0: number;

    /** Touchdown, seconds. */
    t1: number;

    /** The root's world orientation at take-off. */
    q0: IAutoMovieQuaternion;

    /**
     * The somersault frame in the root's frame at take-off: its X the
     * somersault axis, its Y the long axis, its Z the tilt axis. The root's
     * own axes when absent (a forward or backward salto); a side salto turns
     * it a quarter about the long axis.
     */
    frame?: IAutoMovieQuaternion;

    /** Somersault turns about the frame's X, signed (positive tips the head toward the frame's +Z). */
    somersault: number;

    /** Twist turns about the long axis, signed by the right-hand rule about +Y. */
    twist: number;

    /** The largest momentum the take-off can give, kg m²/s; unbounded when absent. */
    maximum?: number;

    /** The residual norm accepted, radians; `TOLERANCE` when absent. */
    tolerance?: number;

    /** The integrator's step, seconds. */
    h?: number;

    /** The integrator's error control, as the flight that reads the momentum integrates it; the fixed step when absent. */
    integration?: Pick< IAutoMovieIntegrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;

    /** Explicit per-read world-momentum defect budget: relative share of the target momentum and absolute kg m squared per second. Requires integration error control and remains independent of its orientation/sensitivity RMS budget. */
    momentumTolerance?: Pick<
      IAutoMovieIntegrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;

    /** Optional caller-owned unique symbol forwarded to each flight's numeric failure, never to the shape history. Admitted before seed/history reads; it changes no shooting or integration decision. */
    errorScope?: symbol;
  }

  /**
   * A solved take-off.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieSolveAirborneTakeoff.ISolution keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSolveAirborneTakeoff.ISolution contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface ISolution {
    /** The whole-body angular momentum about the centre of mass, world, kg m²/s. */
    momentum: IAutoMovieVector3;

    /** What the flight misses at touchdown, revolutions: somersault, tilt and twist. */
    residual: IAutoMovieSolveAirborneTakeoff.IAngles;

    /** Whether the residual is within the tolerance and the momentum within the maximum. */
    met: boolean;

    /** The evaluated flight whose residual was judged; a consumer uses this value for playback instead of reintegrating the momentum on a different adaptive mesh. */
    flight: IAutoMovieIntegrateAirborneRotation.IFlight;
  }

  /**
   * Yeadon's attitude angles, in the unit their reader states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieSolveAirborneTakeoff.IAngles keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSolveAirborneTakeoff.IAngles contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IAngles {
    /** About the frame's lateral axis X. */
    somersault: number;

    /** About its forward axis Z. */
    tilt: number;

    /** About the body's long axis Y. */
    twist: number;
  }
}
