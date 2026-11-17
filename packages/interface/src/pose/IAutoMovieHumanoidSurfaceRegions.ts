import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Where on a segment a region's ray starts: a share of the way from a bone's joint toward a child joint, or the centre of the bone's collider bounds. A region's station and rest-frame outward direction: the ray whose exit through the segment's colliders is the region's point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two forms a station takes. States what the pair defines.
 * @evidence contracts/development/design.md#principled-representation A bone, the joint it leans toward or the bounds centre, and a share. A ray: an origin on the segment and a direction in the rest frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three members the surface resolver reads. The two members a region needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bones are the interface's closed bone union. None; the point itself is read from the colliders, never stored.
 */
export namespace IAutoMovieHumanoidSurfaceRegions {
  /**
   * Where on a segment a region's ray starts: a share of the way from a
   * bone's joint toward a child joint, or the centre of the bone's collider
   * bounds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two forms a station takes.
   * @evidence contracts/development/design.md#principled-representation A bone, the joint it leans toward or the bounds centre, and a share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three members the surface resolver reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bones are the interface's closed bone union.
   */
  export interface IStation {
    /** The bone. */
    bone: AutoMovieHumanoidBone;

    /** A child joint to interpolate toward, or the colliders' bounds centre. */
    toward: AutoMovieHumanoidBone | "centre";

    /** Share of the way toward the child joint. */
    share: number;
  }

  /**
   * A region's station and rest-frame outward direction: the ray whose exit
   * through the segment's colliders is the region's point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the pair defines.
   * @evidence contracts/development/design.md#principled-representation A ray: an origin on the segment and a direction in the rest frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two members a region needs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the point itself is read from the colliders, never stored.
   */
  export interface IDefinition {
    /** Ray origin. */
    station: IAutoMovieHumanoidSurfaceRegions.IStation;

    /** Outward direction in the T-pose rest frame. */
    direction: IAutoMovieVector3;
  }
}
