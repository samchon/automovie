import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * One convex collider of the engine's extended position-based dynamics world
 * (`AutoMovieXpbdWorld`), riding a body: its shape in the body frame and its
 * contact material.
 *
 * A sensor collider takes part in no contact response and is reported only as
 * an overlap, the way the compliant layers of the physical simulation apply
 * their own law. Friction and restitution combine with the other collider's by
 * their mean, the combine rule the physical simulation's profiles were authored
 * against.
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

  /** The shape's own box in its frame: centre and half-extents, metres. */
  private readonly box: AutoMovieXpbdCollider.IBox;
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
    this.box = enclose(shape);
  }

  /**
   * The body it rides.
   *
   * @returns The world's own body record, not a copy.
   */
  public parent(): AutoMovieXpbdBody {
    return this.body;
  }

  /**
   * The body frame's world pose, which the shape's own transform is relative
   * to.
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
   * World axis-aligned bounds of the shape's own box: the box of the shape in
   * its frame (a hull's vertex extremes, a box's half-extents, a capsule's and
   * a sphere's radius-widened axis), turned into the world with `half_world =
   * |R| half_local`. It encloses the shape, so a pair whose bounds are apart
   * cannot touch.
   *
   * @returns World minimum and maximum, metres.
   */
  public bounds(): IAutoMoviePhysicalShapeBounds.IResult {
    const rotation: IAutoMovieQuaternion = this.rotation();
    const centre: IAutoMovieVector3 = Vector3.add(
      this.translation(),
      Quaternion.rotateVector(rotation, this.box.centre),
    );
    const x: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const y: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const z: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const h: IAutoMovieVector3 = this.box.half;
    const half: IAutoMovieVector3 = {
      x: Math.abs(x.x) * h.x + Math.abs(y.x) * h.y + Math.abs(z.x) * h.z,
      y: Math.abs(x.y) * h.x + Math.abs(y.y) * h.y + Math.abs(z.y) * h.z,
      z: Math.abs(x.z) * h.x + Math.abs(y.z) * h.y + Math.abs(z.z) * h.z,
    };
    return {
      min: Vector3.subtract(centre, half),
      max: Vector3.add(centre, half),
    };
  }

  /**
   * The shape frame's world position: the body frame's origin plus the shape's
   * offset rotated by the body.
   *
   * @returns A fresh vector, world metres.
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
   * The shape frame's world rotation: the body's rotation times the shape's
   * body-frame rotation.
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

/** Companion types of {@link AutoMovieXpbdCollider}. */
export namespace AutoMovieXpbdCollider {
  /** A box in a shape's frame. */
  export interface IBox {
    /** Centre in the shape frame, metres. */
    centre: IAutoMovieVector3;

    /** Half-extents along the shape frame's axes, metres. */
    half: IAutoMovieVector3;
  }
}

/** The box of a shape in its own frame. */
function enclose(shape: IAutoMoviePhysicalShape): AutoMovieXpbdCollider.IBox {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (shape.kind === "sphere")
    return {
      centre: origin,
      half: { x: shape.radius, y: shape.radius, z: shape.radius },
    };
  if (shape.kind === "capsule")
    return {
      centre: origin,
      half: {
        x: shape.radius,
        y: shape.halfLength + shape.radius,
        z: shape.radius,
      },
    };
  if (shape.kind === "box")
    return { centre: origin, half: { ...shape.halfExtents } };
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of shape.points) {
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    min.z = Math.min(min.z, p.z);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
    max.z = Math.max(max.z, p.z);
  }
  return {
    centre: Vector3.scale(Vector3.add(min, max), 0.5),
    half: Vector3.scale(Vector3.subtract(max, min), 0.5),
  };
}
