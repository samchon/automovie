import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Where a segment comes nearest a shape.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the nearest shape point from the nearest point on the query segment.
 * @evidence contracts/development/design.md#principled-representation Signed distance is metres; point and at are world metres and normal is the world outward unit direction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalShapeNearest returns this shared reading for projectile/contact geometry without native body ownership.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Negative distance denotes entry into the solid; a nearest-surface reading alone is not a solver contact or impulse.
 */
export namespace IAutoMoviePhysicalShapeNearest {
  /**
   * Where a segment comes nearest a shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the nearest shape point from the nearest point on the query segment.
   * @evidence contracts/development/design.md#principled-representation Signed distance is metres; point and at are world metres and normal is the world outward unit direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalShapeNearest returns this shared reading for projectile/contact geometry without native body ownership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Negative distance denotes entry into the solid; a nearest-surface reading alone is not a solver contact or impulse.
   */
  export interface IResult {
    /** Signed distance, metres; negative when the segment enters. */ distance: number;
    /** The nearest point of the shape's surface, world metres. */ point: IAutoMovieVector3;
    /** Outward unit normal of the surface at `point`, world frame. */ normal: IAutoMovieVector3;
    /** The nearest point of the segment, world metres. */ at: IAutoMovieVector3;
  }
}
