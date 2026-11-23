import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Where a segment comes nearest a shape. */
export namespace IAutoMoviePhysicalShapeNearest {
  /** Where a segment comes nearest a shape. */
  export interface IResult {
    /** Signed distance, metres; negative when the segment enters. */ distance: number;
    /** The nearest point of the shape's surface, world metres. */ point: IAutoMovieVector3;
    /** Outward unit normal of the surface at `point`, world frame. */ normal: IAutoMovieVector3;
    /** The nearest point of the segment, world metres. */ at: IAutoMovieVector3;
  }
}
