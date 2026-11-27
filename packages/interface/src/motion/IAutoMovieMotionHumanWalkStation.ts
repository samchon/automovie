import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";

/** Constants of {@link walkStation}. */
export namespace IAutoMovieMotionHumanWalkStation {
  /** What a walk keeping station reads of its parameters. */
  export interface IStationed {
    /** The floor point to stop at. */
    to: IAutoMovieVector3;

    /** Points passed in order before `to`. */
    via?: IAutoMovieVector3[];

    /** The station, when the walk keeps one. */
    station?: IAutoMovieMotionHumanFormation.IStation;
  }
}
