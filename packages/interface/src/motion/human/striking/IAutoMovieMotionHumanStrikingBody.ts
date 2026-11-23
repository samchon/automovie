import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/** Contracts used by StrikingBody.region. */
export namespace IAutoMovieMotionHumanStrikingBody {
  /**
   * A region of a body at its resolved bones. Result returned by
   * StrikingBody.region. World point and outward normal.
   */
  export type IRegionResult = {
    /** Struck body-region contact point in world metres. */
    point: IAutoMovieVector3;
    /** Outward normal of the struck body region in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
