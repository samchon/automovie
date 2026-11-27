import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalShape } from "../physics/IAutoMoviePhysicalShape";

/**
 * When and where a moving weapon first touches a surface of another body.
 *
 * The weapon is a point on its striking surface (the fist's knuckles, the
 * shin's front, the knee, the sole) moving along the strike's path; the other
 * body is its own collision shapes (the shapes of its physical profile, posed
 * with its bones), so a strike meets whatever the other body has on its line at
 * that instant: the region it aimed at, a blocking forearm, a covering glove, a
 * checking shin, or an arm crossing the line in a simultaneous exchange.
 * Contact is the first instant the weapon point's distance to any shape falls
 * to zero, the continuous-collision test of a moving point against moving
 * convex shapes (Ericson, Real-Time Collision Detection, 2005, ch. 5); it is
 * found by scanning a fixed time step and bisecting the first crossing a fixed
 * number of times, so the result is deterministic and resolved to the step over
 * 2^24.
 *
 * The striking laws' own weapons are now limb capsules resolved jointly by the
 * performance against `HumanColliders`; these point queries and the scan serve
 * a stroke that scans for itself, the floor rest's shape list and the capture
 * verdicts.
 */
export namespace IAutoMovieMotionHumanStrikingContact {
  /** One convex collision shape of the other body, in world metres. */
  export interface ICollider {
    /** What it is, such as the bone it rides. */
    name: string;

    /** The posed frame of the segment that carries the shape, world metres. */
    pose: IAutoMovieRigidTransform;

    /** The profile shape, placed by `pose` composed with its own transform. */
    shape: IAutoMoviePhysicalShape;
  }

  /**
   * The nearest shape to a point and its signed distance. Result returned by
   * StrikingContact.nearest. The nearest shape's name and distance, or
   * undefined without shapes.
   */
  export type INearestResult =
    | {
        /**
         * Name of the nearest physical shape, as supplied by the queried shape
         * collection.
         */
        name: string;
        /**
         * Signed queried-point-to-shape distance, metres; negative inside the
         * shape.
         */
        distance: number;
      }
    | undefined;
}
