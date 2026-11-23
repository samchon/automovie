import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/** Data and callback contracts shared by the ValidateMotion operations. */
export namespace IAutoMovieValidateMotion {
  /**
   * Admit motion identity/skeleton, positive duration, loop, ordered in-range
   * times/easing, frame pose/expression and adjacent-axis speed.
   */
  export type IProps = {
    /** Borrowed clip with second-valued timestamps and degree-valued joints. */
    motion: IAutoMovieMotion;

    /**
     * Current target rig supplying joint membership and effective ROM
     * overrides.
     */
    skeleton: IAutoMovieSkeleton;
  };
}
