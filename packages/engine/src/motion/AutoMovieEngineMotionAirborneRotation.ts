import type { IAutoMovieIntegrateAirborneRotation } from "@automovie/interface";

import { IntegrateAirborneRotationImplementation } from "./internal/IntegrateAirborneRotationImplementation";

/** Public airborne rotation operations for Engine Motion. */
export namespace AutoMovieEngineMotionAirborneRotation {
  /** A constant-shape history factory owned by the physical source. */
  export const fixed = IntegrateAirborneRotationImplementation.fixed;
  /** Create a native observer for history work counters. */
  export const observe = IntegrateAirborneRotationImplementation.observe;
  /** Half-interval of the shape central difference, seconds. */
  export const DELTA: number = IntegrateAirborneRotationImplementation.DELTA;
  /** A history with an explicitly owned numeric memo. */
  export type ICachedHistory =
    IntegrateAirborneRotationImplementation.ICachedHistory;
  /** Build a physical shape history. */
  export const history = IntegrateAirborneRotationImplementation.history;
  /** Build a history from supplied simultaneous bone rates. */
  export const rated = IntegrateAirborneRotationImplementation.rated;
  /** Build a history tabulated on uniform knots. */
  export const tabulated = IntegrateAirborneRotationImplementation.tabulated;
  /** Read the root's angular velocity from a shape instant and momentum. */
  export const rate = IntegrateAirborneRotationImplementation.rate;

  /**
   * Integrate a body's root orientation in torque-free flight.
   *
   * @param props The shape history, flight and momentum.
   * @returns The flight orientation, read by time.
   */
  export function integrate(
    props: IAutoMovieIntegrateAirborneRotation.IProps,
  ): IAutoMovieIntegrateAirborneRotation.IFlight {
    return IntegrateAirborneRotationImplementation.integrateAirborneRotation(
      props,
    );
  }
}
