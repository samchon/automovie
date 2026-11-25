import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A walk on stilts: each foot strapped on a stilt's platform, the stilts' tips
 * the only floor contacts, short steps on a wide base.
 */
export namespace IAutoMovieMotionHumanStiltWalk {
  /** The stilts worn. */
  export interface IStilts {
    /** The stilt under the left foot. */
    left: string;

    /** The stilt under the right foot. */
    right: string;
  }

  /** Parameters. */
  export interface IParams {
    /** The stilts, each standing under its foot as the walk starts. */
    stilts: IStilts;

    /** The floor point to stop at, world metres. */
    to: IAutoMovieVector3;

    /**
     * How many steps, a whole number of at least 1; the fewest short steps that
     * reach `to` when absent.
     */
    steps?: number;
  }
}
