import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the WarpRoot operations. */
export namespace IAutoMovieWarpRoot {
  /** A root displacement over a window. */
  export interface IWarp {
    /** Translation added by the window's end, metres, parent frame. */
    translation: IAutoMovieVector3;

    /** Turn about +Y added by the window's end, degrees. */
    yaw: number;

    /** Window start, seconds. */
    start: number;

    /** Window end, the named event's instant, seconds. */
    end: number;
  }
}
