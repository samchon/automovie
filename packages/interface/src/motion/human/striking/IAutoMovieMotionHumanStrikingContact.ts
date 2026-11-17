import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalShape } from "../../../physics/IAutoMoviePhysicalShape";

/**
 * When and where a moving weapon first touches a surface of another body.
 *
 * The weapon is a point on its striking surface (the fist's knuckles, the
 * shin's front, the knee, the sole) moving along the strike's path; the other
 * body is its own collision shapes (the shapes of its physical profile,
 * posed with its bones), so a strike meets whatever the
 * other body has on its line at that instant: the region it aimed at, a
 * blocking forearm, a covering glove, a checking shin, or an arm crossing the
 * line in a simultaneous exchange. Contact is the first instant the weapon
 * point's distance to any shape falls to zero, the continuous-collision test
 * of a moving point against moving convex shapes (Ericson, Real-Time
 * Collision Detection, 2005, ch. 5); it is found by scanning a fixed time
 * step and bisecting the first crossing a fixed number of times, so the result
 * is deterministic and resolved to the step over 2^24.
 *
 * The striking laws' own weapons are now limb capsules resolved jointly by
 * the performance against `HumanColliders`; these point queries and the
 * scan serve a stroke that scans for itself, the floor rest's shape list and
 * the capture verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pose: The posed frame of the segment that carries the shape, world metres.
 * @evidence contracts/development/design.md#principled-representation pose: The posed frame of the segment that carries the shape, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: reaction/knockdown.ts (knockdown.shapes, return); reaction/knockdown.ts (knockdown.lowest, colliders); reaction/knockdown.ts (knockdown.bottom, c); striking/StrikingBody.ts (StrikingBody.colliders, return); striking/StrikingContact.ts (StrikingContact.distance, shape); striking/StrikingContact.ts (StrikingContact.nearest, shapes).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieRigidTransform, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingContact {
  /**
   * One convex collision shape of the other body, in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each variant and member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The profile's own shape with the posed frame of the segment that carries it, so every kind the profile can hold is posed one way and no second shape vocabulary exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shape, its segment's pose and the bone name a verdict reports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's shape and transform.
   */
  export interface ICollider {
    /** What it is, such as the bone it rides. */
    name: string;

    /** The posed frame of the segment that carries the shape, world metres. */
    pose: IAutoMovieRigidTransform;

    /** The profile shape, placed by `pose` composed with its own transform. */
    shape: IAutoMoviePhysicalShape;
  }

  /**
   * The nearest shape to a point and its signed distance. Result returned by StrikingContact.nearest. The nearest shape's name and distance, or undefined without shapes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation name: Name of the nearest physical shape, as supplied by the queried shape collection. distance: Signed queried-point-to-shape distance, metres; negative inside the shape.
   * @evidence contracts/development/design.md#principled-representation name: Name of the nearest physical shape, as supplied by the queried shape collection. distance: Signed queried-point-to-shape distance, metres; negative inside the shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingContact.ts (StrikingContact.nearest, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in StrikingContact.nearest.
   */
  export type INearestResult =
    | {
        /** Name of the nearest physical shape, as supplied by the queried shape collection. */
        name: string;
        /** Signed queried-point-to-shape distance, metres; negative inside the shape. */
        distance: number;
      }
    | undefined;
}
