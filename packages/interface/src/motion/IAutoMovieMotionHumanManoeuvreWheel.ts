import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";

/** Constants and types of {@link manoeuvreWheel}. */
export namespace IAutoMovieMotionHumanManoeuvreWheel {
  /**
   * A wheel's members' ways, and the stations they keep, or null when nothing
   * turns.
   */
  export interface IWheel {
    /** Each member's arc about the pivot, world metres, by member order. */
    ways: IAutoMovieVector3[][];

    /**
     * Each member's slot in the wheeling formation, by member order; null when
     * nothing turns.
     */
    stations: IAutoMovieMotionHumanFormation.IStation[] | null;
  }
}
