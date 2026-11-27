import type { IAutoMovieSteerCrowd } from "@automovie/interface";

import { SteerAutoMovieCrowdImplementation } from "./internal/SteerAutoMovieCrowdImplementation";

/** Public crowd steering operations for Engine Motion. */
export namespace AutoMovieEngineMotionCrowd {
  /** Relaxation time of the driving term, seconds. */
  export const RELAXATION: number =
    SteerAutoMovieCrowdImplementation.RELAXATION;
  /** Interaction horizon, seconds. */
  export const HORIZON: number = SteerAutoMovieCrowdImplementation.HORIZON;
  /** Energy scale, square metres per second squared. */
  export const K: number = SteerAutoMovieCrowdImplementation.K;
  /** Largest steering push, metres per second squared. */
  export const CAP: number = SteerAutoMovieCrowdImplementation.CAP;
  /** Neighbourhood distance used for heading alignment, metres. */
  export const NEIGHBOURHOOD: number =
    SteerAutoMovieCrowdImplementation.NEIGHBOURHOOD;
  /** Desired travel time ahead of the nearest goal, seconds. */
  export const LOOKAHEAD: number = SteerAutoMovieCrowdImplementation.LOOKAHEAD;
  /** Desired arrival relaxation time, seconds. */
  export const ARRIVAL: number = SteerAutoMovieCrowdImplementation.ARRIVAL;
  /** Maximum speed multiplier when an agent gives none. */
  export const MAXIMUM: number = SteerAutoMovieCrowdImplementation.MAXIMUM;

  /**
   * Plan courses for a crowd while agents anticipate nearby agents and
   * obstacles.
   *
   * @param props The agents, obstacles and planning interval.
   * @returns Each agent's course and predicted contacts.
   */
  export function steer(
    props: IAutoMovieSteerCrowd.IProps,
  ): IAutoMovieSteerCrowd.IResult {
    return SteerAutoMovieCrowdImplementation.steerAutoMovieCrowd(props);
  }
}
