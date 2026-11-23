import type { IAutoMovieResolveContactEvents } from "../geometry/IAutoMovieResolveContactEvents";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieProjectile } from "./IAutoMovieProjectile";

/**
 * Collider surface/departure callbacks, projectile extent and launch-relative
 * contact-search intervals.
 */
export namespace IAutoMovieProjectileFirstContact {
  /**
   * Signed collider-surface reading against the projectile's centre segment.
   *
   * Distance is metres before subtracting projectile radius; point is world
   * metres and normal an outward world unit vector. Collider nearest callbacks
   * produce this reading; projectileFirstContact uses its distance for the
   * sweep and may return point/normal references in the final hit. The
   * callback's physical model owns correctness and finite readings; a segment
   * entering the solid has negative distance, while a capsule radius is
   * accounted for separately.
   */
  export interface INearest {
    /** Signed distance, metres; negative when the segment enters. */
    distance: number;

    /** The nearest point of the collider's surface, world metres. */
    point: IAutoMovieVector3;

    /** The collider's outward unit normal there. */
    normal: IAutoMovieVector3;
  }

  /**
   * A named time-dependent nearest-surface query with optional departure
   * certification.
   *
   * Nearest receives world segment endpoints and seconds since the supplied
   * flight's launch; ids must be unique in the searched collider list.
   * projectileFirstContact invokes these synchronous callbacks repeatedly and
   * propagates errors; returned hit vectors may borrow the callback's result,
   * so preserve their contents. An absent or undefined departure certificate
   * retains ordinary initial-overlap reporting. A certificate is checked by the
   * shared contact resolver and cannot excuse other colliders or later
   * reentry.
   */
  export interface ICollider {
    /** Unique id among the colliders. */
    id: string;

    /**
     * Measure signed separation from the world segment at launch-relative
     * seconds. Coincident endpoints represent a point. Return the same
     * separation in metres as nearest, before subtracting projectile radius.
     * The sweep uses nearest when this reader is absent and to construct the
     * chosen surface witness. Errors propagate.
     */
    distance?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
    ): number;

    /**
     * Optional bound on how fast any point of the collider's surface moves
     * between two launch-relative seconds, metres per second, finite and not
     * negative, or undefined where none is known. With it and the flight's own
     * bound the sweep reads this collider only as their gap could close
     * (conservative advancement); absent, every scan step reads it. A bound a
     * point exceeds lets a contact be missed, so state only a certified one.
     */
    speed?(from: number, to: number): number | undefined;

    /**
     * Optional synchronous certificate for an explicitly resolved initial
     * contact, on the supplied flight clock. Return undefined when the model
     * cannot prove departure; shared resolver validation may throw. No callback
     * is retained after the search.
     */
    departure?(
      projectile: IAutoMovieProjectile,
      options: IAutoMovieProjectileFirstContact.IOptions,
      contact: IAutoMovieResolveContactEvents.IInitialContact,
    ): IAutoMovieResolveContactEvents.Departure | undefined;

    /**
     * Synchronously measure the world centre segment from a to b at
     * launch-relative seconds, using a point when endpoints coincide. Return
     * signed separation in metres and a world surface point/outward unit
     * normal. Errors propagate; hit vectors may borrow this result.
     */
    nearest(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
    ): IAutoMovieProjectileFirstContact.INearest;
  }

  /**
   * Projectile extent and spatial resolution policy for a finite contact sweep.
   *
   * Radius is finite nonnegative metres, thickness finite positive metres and
   * optional tail a body-local offset in metres requiring projectile attitude.
   * projectileFirstContact derives the time step from projectile translation
   * and rotation bounds; departing identifies an already-resolved initial
   * collider for its departure model. Admission rejects invalid
   * radius/thickness or a tail without attitude. Colliders thinner than
   * thickness and opaque unbounded collider motion are not guaranteed
   * detectable by this finite sweep.
   */
  export interface IOptions {
    /**
     * Collider whose initial contact was already resolved by a continuation.
     * Only a physical departure certificate may defer this pair; absent or
     * unknown, initial overlap/touch is still reported. Other colliders and
     * this collider's later entry remain in the same sweep.
     */
    departing?: string;

    /** The projectile's radius, metres; 0 for a point. */
    radius: number;

    /**
     * A capsule's other end in the body's own frame from the flight's point,
     * metres; a sphere when absent. Needs an attitude.
     */
    tail?: IAutoMovieVector3;

    /** The thinnest collider the search must not step over, metres; positive. */
    thickness: number;
  }

  /**
   * Forward search interval on the supplied flight's launch-relative clock.
   *
   * From and to are finite seconds with to strictly greater than from;
   * projectileFirstContact does not impose a nonnegative lower bound. The
   * search samples the complete interval through the shared contact resolver
   * and returns the first detected hit or null. Invalid or zero-length
   * intervals throw. Step sizing follows the declared projectile extent and
   * thickness, so a null result is limited by that sweep resolution.
   */
  export type ISpan = {
    /** Finite first second relative to this flight's launch. */
    from: number;

    /** Finite last second relative to launch, strictly greater than from. */
    to: number;
  };

  /**
   * A placed shape's actual pose and optional continuous motion knowledge.
   *
   * Both readers use seconds since the supplied projectile's launch. The pose
   * path gives the unchanged shape's parent translation in world metres and a
   * unit parent-to-world orientation. The bounded shape builder admits finite
   * samples and normalizes rotations within the rigid-pose norm tolerance. The
   * motion declaration describes this same physical path.
   */
  export interface IContinuousPose {
    /**
     * Read the actual parent pose at this launch-relative second. Both the
     * ordinary scalar/nearest queries and the clearance witness use this pose.
     */
    at(seconds: number): IAutoMovieRigidTransform;

    /**
     * Give a continuous bound for a prefix starting at from and ending by to.
     * Only the resolved initial pair can request this bound. Return undefined
     * when the continuous motion is unknown. A malformed bound raises
     * RangeError and callback errors propagate.
     */
    bound(from: number, to: number): IMotionBound | undefined;
  }

  /**
   * Bounds for an absolutely continuous rigid-pose prefix.
   *
   * The world velocity of the parent origin stays within velocityError of
   * referenceVelocity in Euclidean norm. The physical orientation's angular
   * speed stays within angularSpeed regardless of quaternion sign, with both
   * bounds valid almost everywhere on the entire prefix. A shape's local offset
   * turns about that parent origin.
   */
  export interface IMotionBound {
    /**
     * Finite last launch-relative second, after the requested start and no
     * later than the requested end.
     */
    to: number;

    /**
     * Finite reference velocity of the shape's parent origin, world metres per
     * second.
     */
    referenceVelocity: IAutoMovieVector3;

    /** Finite nonnegative bound on the velocity's deviation, metres per second. */
    velocityError: number;

    /**
     * Finite nonnegative bound on angular speed about the parent origin,
     * radians per second.
     */
    angularSpeed: number;
  }
}
