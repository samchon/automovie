import type { IAutoMovieProjectileDragInterval } from "./IAutoMovieProjectileDragInterval";
import type { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";

/** Data and callback contracts shared by the ProjectileDragFlight operations. */
export namespace IAutoMovieProjectileDragFlight {
  /** A drag flight's reader. */
    export interface IFlight {
      /** The integration step, seconds. */
      step: number;
  
      /** The largest speed the flight reaches, m/s: the launch speed or the terminal speed, whichever is larger. */
      fastest: number;
  
      /**
       * Read the actual cubic interval containing a nonnegative flight time.
       *
       * @param seconds Seconds since launch; negative times select the first interval.
       * @returns Actual adjacent knot times with fresh endpoint states.
       */
      interval(seconds: number): IAutoMovieProjectileDragInterval;
  
      /**
       * The state at a second after the launch.
       *
       * @param seconds Seconds since the launch; before it, the launch state.
       * @returns Position and velocity.
       */
      at(seconds: number): IAutoMovieProjectileState;
    }
}
