import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalShape } from "../physics/IAutoMoviePhysicalShape";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A posed body's colliders as signed distances: how far a point, or a segment
 * (a capsule weapon's axis), lies outside the body's profile shapes (negative
 * inside), and on which segment.
 *
 * Each profile segment's shapes are placed by its bone: the segment's neutral
 * frame is its rest frame, and the canonical rig rests unrotated, so a
 * segment's posed frame is the bone's world transform applied to the segment's
 * neutral offset from the bone's rest joint. Every shape distance is the
 * engine's single owner, `physicalShapeSegmentDistance`, and the body's
 * distance is the least over its shapes, the distance to their union. A shape
 * whose bounding sphere already lies farther than the least distance found is
 * passed over without the exact query, which cannot change the least, so the
 * searches that call this in loops pay for the near shapes only.
 */
export namespace IAutoMovieMotionHumanColliders {
  /**
   * A body's colliders at rest, prepared once when the body is made: each
   * profile segment's offset from its bone's rest joint, its turn and its
   * shapes, a left segment its right twin's mirror image in the median plane,
   * and the bones they ride.
   */
  export interface INeutral {
    /** The segments, in profile order. */
    segments: readonly ISegment[];

    /** The canonical bones the segments ride. */
    bones: ReadonlySet<AutoMovieHumanoidBone>;
  }

  /** One segment's colliders at rest. */
  export interface ISegment {
    /** The profile bone the segment rides. */
    bone: string;

    /** Its offset from the bone's rest joint, metres. */
    offset: IAutoMovieVector3;

    /** Its neutral turn. */
    rotation: IAutoMovieRigidTransform["rotation"];

    /** Its shapes, reflected for a mirrored side. */
    shapes: readonly IAutoMoviePhysicalShape[];
  }

  /**
   * One profile segment placed by its posed bone: the parent pose its shapes
   * compose with.
   */
  export interface IPlaced extends IFramed {
    /** The resolved rig bone carrying this segment. */
    bone: AutoMovieHumanoidBone;
  }

  /** A collider segment's world frame and its shapes, whatever carries it. */
  export interface IFramed {
    /** Current world segment frame, including its neutral offset and turn. */
    pose: IAutoMovieRigidTransform;

    /** Existing neutral shape definitions, borrowed without mutation. */
    shapes: readonly IAutoMoviePhysicalShape[];
  }

  /**
   * A collider segment of another subject than a human body, a prop or an
   * animal (a horse's neck, a table's top), placed in the world: an obstacle a
   * limb keeps clear of, named by its subject and part in a refusal.
   */
  export interface IExternal extends IFramed {
    /** The scene subject the segment belongs to. */
    subject: string;

    /** The segment's own part name within its subject. */
    part: string;
  }

  /** A signed distance and the segment it is measured to. */
  export interface IDistance {
    /** Metres, negative inside. */
    distance: number;

    /** The nearest segment's bone. */
    bone: AutoMovieHumanoidBone;
  }

  /**
   * The first point of a posed body's colliders along a ray, by sphere tracing:
   * the signed distance at a point is how far the ray may advance without
   * passing a surface, so each step moves by it until the distance falls within
   * `CAST_TOLERANCE`. The normal is the distance's gradient there, by central
   * differences over `CAST_PROBE`. A ray that starts inside the body hits at
   * its start. A hand surface laid on the trunk takes its place and facing from
   * this, on the colliders themselves. Where a ray meets a posed body.
   */
  export interface IHit {
    /** Accepted ray point, world metres; the start itself when already inside. */
    point: IAutoMovieVector3;

    /**
     * Normalized central-difference direction; the existing zero vector when
     * its gradient is zero.
     */
    normal: IAutoMovieVector3;

    /** The bone of the segment that was hit. */
    bone: AutoMovieHumanoidBone;
  }

  /** A sphere containing a shape, in the shape's own frame. */
  export interface IBall {
    /** The sphere's centre, shape-local metres. */
    centre: IAutoMovieVector3;

    /** The sphere's radius, metres. */
    radius: number;
  }

  /**
   * Where a segment comes nearest a posed body: the signed distance and the
   * bone of `distanceToSegment`, with the point of that bone's colliders
   * nearest the segment and their outward normal there, read by the engine's
   * one proximity owner (`physicalShapeNearest`). A flight's contact reads
   * where it struck and which way the surface faced. Result returned by
   * HumanColliders.nearest. The distance, the bone, the surface point and its
   * outward normal.
   */
  export type INearestResult = IAutoMovieMotionHumanColliders.IDistance & {
    /** Nearest collider surface point in world metres. */
    point: IAutoMovieVector3;
    /** Outward surface normal at that point in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
