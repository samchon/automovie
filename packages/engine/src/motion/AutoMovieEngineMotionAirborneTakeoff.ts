import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
} from "@automovie/interface";

import { SolveAirborneTakeoffImplementation } from "./internal/SolveAirborneTakeoffImplementation";
import { AirborneTakeoffQuadrature as AirborneTakeoffQuadratureImplementation } from "./AirborneTakeoffQuadrature";

/** Public take-off solving operations for Engine Motion. */
export namespace AutoMovieEngineMotionAirborneTakeoff {
  /** Newton iterations at most, a search work budget. */
  export const ITERATIONS: number =
    SolveAirborneTakeoffImplementation.ITERATIONS;
  /** Backtracking halvings at most per Newton iteration. */
  export const HALVINGS: number = SolveAirborneTakeoffImplementation.HALVINGS;
  /** Default angular residual tolerance, radians. */
  export const TOLERANCE: number = SolveAirborneTakeoffImplementation.TOLERANCE;

  /**
   * Integrate a finite vector-valued take-off seed with adaptive Simpson.
   *
   * @param props The interval, pure integrand, output-error measure and budget.
   * @returns The Richardson-corrected integral vector.
   */
  export function quadrature(
    props: Parameters<typeof AirborneTakeoffQuadratureImplementation>[0],
  ): number[] {
    return AirborneTakeoffQuadratureImplementation(props);
  }

  /**
   * Solve for the take-off momentum that reaches the requested flight attitude.
   *
   * @param props The flight, take-off frame, request and bounds.
   * @returns The momentum, residual and whether the request is met.
   */
  export function solve(
    props: IAutoMovieSolveAirborneTakeoff.IProps,
  ): IAutoMovieSolveAirborneTakeoff.ISolution {
    return SolveAirborneTakeoffImplementation.solveAirborneTakeoff(props);
  }

  /**
   * Read Yeadon's somersault, tilt and twist angles in radians.
   *
   * @param frame The frame in which the attitude is measured.
   * @param q The body's orientation quaternion.
   * @returns The three attitude angles in radians.
   */
  export function angles(
    frame: IAutoMovieQuaternion,
    q: IAutoMovieQuaternion,
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
    return SolveAirborneTakeoffImplementation.angles(frame, q);
  }

  /**
   * Read touchdown attitude with somersault and twist unwrapped across flight
   * knots.
   *
   * @param flight The body's orientation through flight.
   * @param frame The take-off frame.
   * @returns The unwrapped touchdown attitude in radians.
   */
  export function unwrapped(
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    frame: IAutoMovieQuaternion,
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
    return SolveAirborneTakeoffImplementation.unwrapped(flight, frame);
  }
}
