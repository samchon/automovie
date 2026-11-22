import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * One convex collider of the engine's extended position-based dynamics
 * world (`AutoMovieXpbdWorld`), riding a body: its shape in the body frame
 * and its contact material.
 *
 * A sensor collider takes part in no contact response and is reported only
 * as an overlap, the way the compliant layers of the physical simulation
 * apply their own law. Friction and restitution combine with the other
 * collider's by their mean, the combine rule the physical simulation's
 * profiles were authored against.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame of the shape, the material, the sensor case and the combine rule.
 * @evidence contracts/development/design.md#principled-representation The profile's own shape record in the body frame, a dimensionless friction and restitution, and a sensor flag.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the world's contact solve and the simulation's contact readers use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's shape type instead of a solver-specific shape.
 */
export class AutoMovieXpbdCollider {
  /** Its handle, unique in its world. */
  public readonly handle: number;

  /** The body it rides. */
  public readonly body: AutoMovieXpbdBody;

  /** The shape, its transform in the body frame. */
  public readonly shape: IAutoMoviePhysicalShape;

  /** Coulomb friction coefficient. */
  public readonly friction: number;

  /** Normal restitution coefficient. */
  public readonly restitution: number;

  /** Whether it only reports overlaps. */
  public readonly sensor: boolean;
  /**
   * Create a collider on a body.
   *
   * @param handle Its handle, unique in its world.
   * @param body The body it rides.
   * @param shape The shape, its transform in the body frame.
   * @param friction Coulomb friction coefficient.
   * @param restitution Normal restitution coefficient.
   * @param sensor Whether it only reports overlaps.
   */
  public constructor(
    handle: number,
    body: AutoMovieXpbdBody,
    shape: IAutoMoviePhysicalShape,
    friction: number,
    restitution: number,
    sensor: boolean,
  ) {
    this.handle = handle;
    this.body = body;
    this.shape = shape;
    this.friction = friction;
    this.restitution = restitution;
    this.sensor = sensor;
  }

  /**
   * The body it rides.
   *
   * @returns The body.
   */
  public parent(): AutoMovieXpbdBody {
    return this.body;
  }

  /**
   * The body frame's world pose, which the shape's own transform is relative to.
   *
   * @returns A fresh pose, world metres.
   */
  public bodyPose(): IAutoMovieRigidTransform {
    return {
      position: this.body.translation(),
      rotation: this.body.rotation(),
    };
  }

  /**
   * The shape frame's world position.
   *
   * @returns Metres.
   */
  public translation(): IAutoMovieVector3 {
    return Vector3.add(
      this.body.translation(),
      Quaternion.rotateVector(
        this.body.orientation,
        this.shape.transform.position,
      ),
    );
  }

  /**
   * The shape frame's world rotation.
   *
   * @returns A fresh unit quaternion.
   */
  public rotation(): IAutoMovieQuaternion {
    return Quaternion.multiply(
      this.body.orientation,
      this.shape.transform.rotation,
    );
  }
}
