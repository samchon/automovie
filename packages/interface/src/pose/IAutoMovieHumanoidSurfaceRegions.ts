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
   * @evidence contracts/development/design.md#principled-representation A ray: an origin on the segment, by a share of it or by a level of the body's stature, and a direction in the rest frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two members a region needs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the point itself is read from the colliders, never stored.
   */
  export interface IDefinition {
    /** Ray origin. */
    station: IAutoMovieHumanoidSurfaceRegions.IStation | ILevel;

    /** Outward direction in the T-pose rest frame. */
    direction: IAutoMovieVector3;
  }

  /**
   * Where on a segment a region's ray starts by the body's own measure: the
   * point of the segment from a bone's joint toward a child joint that stands,
   * at rest, at a share of the body's stature above the floor. A landmark
   * that anthropometry measures as a height (the tenth rib's) lies between
   * two joints at a share of the segment that differs from body to body, so
   * it is placed by its height and not by a share of the bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the level means, its frame (rest, floor at zero) and why a landmark is placed by it.
   * @evidence contracts/development/design.md#principled-representation A bone, the child joint it leans toward and a dimensionless share of stature; the surface resolver reads the stature off the body's colliders as `measureAutoMovieHumanoidBody` does.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three members the surface resolver reads; the trunk's lower rib regions use it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bones are the interface's closed bone union; a level outside the segment's span is refused by the resolver, not clamped.
   */
  export interface ILevel {
    /** The bone. */
    bone: AutoMovieHumanoidBone;

    /** The child joint the segment runs toward. */
    toward: AutoMovieHumanoidBone;

    /** Height above the floor at rest, as a share of the body's stature. */
    level: number;
  }
}
