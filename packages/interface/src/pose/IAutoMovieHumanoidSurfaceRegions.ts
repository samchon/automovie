import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Where on a segment a region's ray starts: a share of the way from a bone's
 * joint toward a child joint, or the centre of the bone's collider bounds. A
 * region's station and rest-frame outward direction: the ray whose exit through
 * the segment's colliders is the region's point.
 */
export namespace IAutoMovieHumanoidSurfaceRegions {
  /**
   * Where on a segment a region's ray starts: a share of the way from a bone's
   * joint toward a child joint, or the centre of the bone's collider bounds.
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
   * at rest, at a share of the body's stature above the floor. A landmark that
   * anthropometry measures as a height (the tenth rib's) lies between two
   * joints at a share of the segment that differs from body to body, so it is
   * placed by its height and not by a share of the bone.
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
