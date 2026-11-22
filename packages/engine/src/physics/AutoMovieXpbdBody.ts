import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * One rigid body of the engine's extended position-based dynamics world
 * (`AutoMovieXpbdWorld`; Mueller, Macklin, Chentanez, Jeschke and Kim 2020,
 * "Detailed Rigid Body Simulation with Extended Position Based Dynamics").
 *
 * The body frame's origin and rotation are the pose its readers see; the
 * centre of mass lies at `centerOfMass` in that frame, and the solver moves
 * the centre (`center`). Linear velocity is the centre's, angular velocity
 * is in world radians per second. A kinematic body has no inverse mass or
 * inertia: corrections never move it, and each step carries it to the pose
 * set for the step's end. Forces and torques accumulate until cleared and
 * act through the next integration. The world owns and mutates these
 * records during a step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frames, units, kinematic case, force accumulation and ownership.
 * @evidence contracts/development/design.md#principled-representation World metres and unit quaternions for poses, metres and radians per second for velocities, inverse kilograms and inverse kilogram square metres for mass properties; a kinematic body is the one whose inverse mass the corrections read as zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the physical simulation's trackers, contacts, balance and ownership read and write: pose, velocities, point velocity, mass properties, accumulated wrench, body kind and the next kinematic pose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One class for dynamic and kinematic bodies, told apart by their kind, as the solver's formulas treat them.
 */
export class AutoMovieXpbdBody {
  /** Its handle, unique in its world. */
  public readonly handle: number;

  /** Whether forces and corrections move it. */
  public dynamic: boolean;
  /** World centre of mass, metres. */
  public center: IAutoMovieVector3;

  /** World rotation of the body frame. */
  public orientation: IAutoMovieQuaternion;

  /** The centre at the start of the current step. */
  public previousCenter: IAutoMovieVector3;

  /** The rotation at the start of the current step. */
  public previousOrientation: IAutoMovieQuaternion;

  /** Linear velocity of the centre of mass, metres per second. */
  public velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Angular velocity, world radians per second. */
  public angularVelocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Mass, kilograms. */
  public bodyMass: number = 0;

  /** Centre of mass in the body frame, metres. */
  public centerOfMass: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Principal moments, kilogram square metres. */
  public inertia: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Rotation from the principal inertia frame to the body frame. */
  public inertiaRotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

  /** Multiplier on world gravity. */
  public gravityScale: number = 1;

  /** Accumulated world force at the centre, newtons. */
  public force: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Accumulated world torque, newton metres. */
  public torque: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Extra constraint passes this body asks of its step, on top of the world's. */
  public extraPasses: number = 0;

  /** Extra sweeps per pass this body asks of its step. */
  public extraSweeps: number = 0;

  /** The body-frame pose a kinematic body reaches at the end of the next step; absent, it holds. */
  public next: IAutoMovieRigidTransform | undefined;

  /**
   * Create a body at a pose.
   *
   * @param handle Its handle, unique in its world.
   * @param dynamic Whether forces and corrections move it.
   * @param position World position of the body frame's origin, metres.
   * @param rotation World rotation of the body frame.
   */
  public constructor(
    handle: number,
    dynamic: boolean,
    position: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ) {
    this.handle = handle;
    this.dynamic = dynamic;
    this.orientation = Quaternion.normalize(rotation);
    this.center = { ...position };
    this.previousCenter = { ...position };
    this.previousOrientation = { ...this.orientation };
  }

  /**
   * World position of the body frame's origin.
   *
   * @returns Metres.
   */
  public translation(): IAutoMovieVector3 {
    return Vector3.subtract(
      this.center,
      Quaternion.rotateVector(this.orientation, this.centerOfMass),
    );
  }

  /**
   * World rotation of the body frame.
   *
   * @returns A fresh unit quaternion.
   */
  public rotation(): IAutoMovieQuaternion {
    return { ...this.orientation };
  }

  /**
   * World centre of mass.
   *
   * @returns Metres.
   */
  public worldCom(): IAutoMovieVector3 {
    return { ...this.center };
  }

  /**
   * Place the body frame at a pose, keeping its velocities.
   *
   * @param position World origin, metres.
   * @param rotation World rotation.
   */
  public place(
    position: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): void {
    this.orientation = Quaternion.normalize(rotation);
    this.center = Vector3.add(
      position,
      Quaternion.rotateVector(this.orientation, this.centerOfMass),
    );
  }

  /**
   * Set the mass properties, keeping the body frame's pose.
   *
   * @param mass Kilograms.
   * @param centerOfMass Body-frame centre, metres.
   * @param inertia Principal moments, kilogram square metres.
   * @param inertiaRotation Principal frame in the body frame.
   */
  public setMass(
    mass: number,
    centerOfMass: IAutoMovieVector3,
    inertia: IAutoMovieVector3,
    inertiaRotation: IAutoMovieQuaternion,
  ): void {
    const origin: IAutoMovieVector3 = this.translation();
    this.bodyMass = mass;
    this.centerOfMass = { ...centerOfMass };
    this.inertia = { ...inertia };
    this.inertiaRotation = Quaternion.normalize(inertiaRotation);
    this.place(origin, this.orientation);
    this.previousCenter = { ...this.center };
  }

  /**
   * Mass, kilograms.
   *
   * @returns The mass.
   */
  public mass(): number {
    return this.bodyMass;
  }

  /**
   * Inverse mass the corrections use: zero for a kinematic body.
   *
   * @returns Per kilogram.
   */
  public inverseMass(): number {
    return this.dynamic && this.bodyMass > 0 ? 1 / this.bodyMass : 0;
  }

  /**
   * The world inverse inertia applied to a world vector, `R I^-1 R^T v`,
   * with `R` the body rotation times its inertia rotation; zero for a
   * kinematic body.
   *
   * @param v A world vector.
   * @returns The product, world frame.
   */
  public inverseInertia(v: IAutoMovieVector3): IAutoMovieVector3 {
    if (!this.dynamic) return { x: 0, y: 0, z: 0 };
    const r: IAutoMovieQuaternion = Quaternion.multiply(
      this.orientation,
      this.inertiaRotation,
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(r),
      v,
    );
    return Quaternion.rotateVector(r, {
      x: this.inertia.x > 0 ? local.x / this.inertia.x : 0,
      y: this.inertia.y > 0 ? local.y / this.inertia.y : 0,
      z: this.inertia.z > 0 ? local.z / this.inertia.z : 0,
    });
  }

  /**
   * The world inertia applied to a world vector, `R I R^T v`.
   *
   * @param v A world vector.
   * @returns The product, world frame.
   */
  public worldInertia(v: IAutoMovieVector3): IAutoMovieVector3 {
    const r: IAutoMovieQuaternion = Quaternion.multiply(
      this.orientation,
      this.inertiaRotation,
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(r),
      v,
    );
    return Quaternion.rotateVector(r, {
      x: local.x * this.inertia.x,
      y: local.y * this.inertia.y,
      z: local.z * this.inertia.z,
    });
  }

  /**
   * Linear velocity of the centre of mass.
   *
   * @returns Metres per second.
   */
  public linvel(): IAutoMovieVector3 {
    return { ...this.velocity };
  }

  /**
   * Angular velocity.
   *
   * @returns World radians per second.
   */
  public angvel(): IAutoMovieVector3 {
    return { ...this.angularVelocity };
  }

  /**
   * Set the centre's linear velocity.
   *
   * @param v Metres per second.
   */
  public setLinvel(v: IAutoMovieVector3): void {
    this.velocity = { ...v };
  }

  /**
   * Set the angular velocity.
   *
   * @param w World radians per second.
   */
  public setAngvel(w: IAutoMovieVector3): void {
    this.angularVelocity = { ...w };
  }

  /**
   * The velocity of the material point at a world position: `v + w x (p - c)`.
   *
   * @param point World metres.
   * @returns Metres per second.
   */
  public velocityAtPoint(point: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.add(
      this.velocity,
      Vector3.cross(this.angularVelocity, Vector3.subtract(point, this.center)),
    );
  }

  /**
   * Apply an impulse at a world point: `v += p / m`, `w += I^-1 ((x - c) x p)`;
   * a kinematic body ignores it.
   *
   * @param impulse World newton seconds.
   * @param point World metres.
   */
  public applyImpulseAtPoint(
    impulse: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): void {
    if (!this.dynamic) return;
    this.velocity = Vector3.add(
      this.velocity,
      Vector3.scale(impulse, this.inverseMass()),
    );
    this.angularVelocity = Vector3.add(
      this.angularVelocity,
      this.inverseInertia(
        Vector3.cross(Vector3.subtract(point, this.center), impulse),
      ),
    );
  }

  /**
   * Accumulate a force at the centre of mass.
   *
   * @param force World newtons.
   */
  public addForce(force: IAutoMovieVector3): void {
    this.force = Vector3.add(this.force, force);
  }

  /**
   * Accumulate a torque.
   *
   * @param torque World newton metres.
   */
  public addTorque(torque: IAutoMovieVector3): void {
    this.torque = Vector3.add(this.torque, torque);
  }

  /**
   * Accumulate a force at a world point: the force at the centre plus its moment about it.
   *
   * @param force World newtons.
   * @param point World metres.
   */
  public addForceAtPoint(
    force: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): void {
    this.addForce(force);
    this.addTorque(Vector3.cross(Vector3.subtract(point, this.center), force));
  }

  /** Clear the accumulated force. */
  public resetForces(): void {
    this.force = { x: 0, y: 0, z: 0 };
  }

  /** Clear the accumulated torque. */
  public resetTorques(): void {
    this.torque = { x: 0, y: 0, z: 0 };
  }

  /**
   * The accumulated force.
   *
   * @returns World newtons.
   */
  public userForce(): IAutoMovieVector3 {
    return { ...this.force };
  }

  /**
   * The accumulated torque.
   *
   * @returns World newton metres.
   */
  public userTorque(): IAutoMovieVector3 {
    return { ...this.torque };
  }

  /**
   * Whether forces and corrections move the body.
   *
   * @returns True for a dynamic body.
   */
  public isDynamic(): boolean {
    return this.dynamic;
  }

  /**
   * Whether the body follows set poses.
   *
   * @returns True for a kinematic body.
   */
  public isKinematic(): boolean {
    return !this.dynamic;
  }

  /**
   * Make the body dynamic or kinematic, keeping its pose and velocities.
   *
   * @param dynamic Whether it becomes dynamic.
   */
  public setDynamic(dynamic: boolean): void {
    this.dynamic = dynamic;
    this.next = undefined;
  }

  /**
   * Move the body frame's origin, keeping its rotation and velocities.
   *
   * @param position World metres.
   */
  public setTranslation(position: IAutoMovieVector3): void {
    this.place(position, this.orientation);
    this.previousCenter = { ...this.center };
  }

  /**
   * Turn the body frame about its origin, keeping its velocities.
   *
   * @param rotation World rotation.
   */
  public setRotation(rotation: IAutoMovieQuaternion): void {
    this.place(this.translation(), rotation);
    this.previousCenter = { ...this.center };
    this.previousOrientation = { ...this.orientation };
  }

  /**
   * The body-frame position a kinematic body reaches at the end of the next step.
   *
   * @returns World metres; the current position when none is set.
   */
  public nextTranslation(): IAutoMovieVector3 {
    return this.next ? { ...this.next.position } : this.translation();
  }

  /**
   * The rotation a kinematic body reaches at the end of the next step.
   *
   * @returns A fresh unit quaternion; the current rotation when none is set.
   */
  public nextRotation(): IAutoMovieQuaternion {
    return this.next ? { ...this.next.rotation } : this.rotation();
  }

  /**
   * Set the body-frame position a kinematic body reaches at the end of the next step.
   *
   * @param position World metres.
   */
  public setNextKinematicTranslation(position: IAutoMovieVector3): void {
    this.next = {
      position: { ...position },
      rotation: this.next?.rotation ?? this.rotation(),
    };
  }

  /**
   * Set the rotation a kinematic body reaches at the end of the next step.
   *
   * @param rotation World rotation.
   */
  public setNextKinematicRotation(rotation: IAutoMovieQuaternion): void {
    this.next = {
      position: this.next?.position ?? this.translation(),
      rotation: { ...rotation },
    };
  }
}
