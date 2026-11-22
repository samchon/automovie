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

  /** The world inverse inertia frozen for the current substep, row-major. */
  public frozen: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];

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
   * World position of the body frame's origin: the centre of mass less the
   * rotated body-frame centre, `c - R com`.
   *
   * @returns A fresh vector, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and formula of the returned origin.
   * @evidence contracts/development/implementation.md#principled-implementation The solver moves the centre of mass, so the frame origin follows from it and the rotated body-frame centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression over the body's own pose and mass properties.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; a body without mass properties has a zero body-frame centre and returns its centre.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one quaternion rotation and one subtraction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read of the current pose; the next correction changes it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and that the result is a fresh copy.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the stored orientation, which the constructor and every placement normalise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, one fresh record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh quaternion so a caller cannot mutate the body; retains nothing.
   */
  public rotation(): IAutoMovieQuaternion {
    return { ...this.orientation };
  }

  /**
   * World centre of mass.
   *
   * @returns A fresh vector, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and that the result is a fresh copy.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the centre the solver integrates and corrects.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, one fresh record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public worldCom(): IAutoMovieVector3 {
    return { ...this.center };
  }

  /**
   * Place the body frame at a pose, keeping its velocities and its previous
   * pose: the centre becomes `p + R com` under the normalised rotation.
   *
   * @param position World origin, metres.
   * @param rotation World rotation; normalised here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units, the normalisation and what the placement keeps.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of translation: the centre is the origin plus the rotated body-frame centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sets orientation and centre only; callers that start a new step's history (setMass, setTranslation, setRotation) reset the previous pose themselves.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case for kinematic bodies; the world's integrate uses the same placement for a set kinematic pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one normalisation, one rotation, one addition.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores fresh pose records on the body; retains no caller object.
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
   * Set the mass properties, keeping the body frame's pose: the centre moves
   * to the new body-frame centre and the previous centre follows it, so the
   * change adds no velocity at the next derivation.
   *
   * @param mass Kilograms.
   * @param centerOfMass Body-frame centre, metres.
   * @param inertia Principal moments, kilogram square metres.
   * @param inertiaRotation Principal frame in the body frame; normalised here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and frames of each property, the kept pose and the previous-centre reset.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the frame origin before the change and re-places the frame there, so only the centre of mass moves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copies the properties, then reuses translation and place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; values are stored as given and admission belongs to the binding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores copies of the given vectors; retains no caller object.
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
   * Mass, kilograms; zero until `setMass`, whatever the body's kind.
   *
   * @returns The mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the default.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the stored mass; the inverse mass, not this value, tells a kinematic body apart.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A read of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a number; retains nothing.
   */
  public mass(): number {
    return this.bodyMass;
  }

  /**
   * Inverse mass the corrections use: zero for a kinematic body and for a
   * body without positive mass.
   *
   * @returns Per kilogram.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and both zero cases.
   * @evidence contracts/development/implementation.md#principled-implementation Mueller et al. 2020 give an immovable body zero inverse mass, so the generalized inverse masses leave it unmoved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The zero for non-positive mass guards the division for a body whose mass is not yet set, which then takes no correction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One division; nothing worth sharing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a number; retains nothing.
   */
  public inverseMass(): number {
    return this.dynamic && this.bodyMass > 0 ? 1 / this.bodyMass : 0;
  }

  /**
   * The world inverse inertia applied to a world vector, `R I^-1 R^T v`,
   * with `R` the body rotation times its inertia rotation; zero for a
   * kinematic body.
   *
   * A zero principal moment contributes zero on its axis.
   *
   * @param v A world vector.
   * @returns The product, world frame, per kilogram square metre.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula, its frames, the kinematic zero and the zero-moment axis.
   * @evidence contracts/development/implementation.md#principled-implementation The inertia tensor is diagonal in its principal frame, so its inverse divides the vector's principal coordinates by the moments, rotated back to the world.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rotate in, divide per axis, rotate out.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero moment yields zero on that axis instead of an infinity, so a body without mass properties takes no angular correction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one quaternion product and two rotations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work freezeInverseInertia evaluates this map once a substep and keeps it as a matrix for that substep's corrections.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
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
   * Freeze the world inverse inertia at the current orientation for the
   * substep's corrections: the world calls it once a substep, after the
   * predicted pose, as solvers hold the effective inertia fixed over a
   * step's constraint iterations. The matrix is row-major, its columns the
   * map's images of the world axes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the world calls it, why the inertia is held fixed and the matrix layout.
   * @evidence contracts/development/implementation.md#principled-implementation A linear map is its images of the basis vectors, so three applications of inverseInertia give the exact world matrix at the predicted orientation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the matrix from inverseInertia, so the frozen and live maps share one formula.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; a kinematic body's columns are zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: three map applications once a substep.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the matrix across the substep's corrections; the next call at the next substep's predicted pose replaces it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one nine-number array per body, replaced at each call.
   */
  public freezeInverseInertia(): void {
    const x: IAutoMovieVector3 = this.inverseInertia({ x: 1, y: 0, z: 0 });
    const y: IAutoMovieVector3 = this.inverseInertia({ x: 0, y: 1, z: 0 });
    const z: IAutoMovieVector3 = this.inverseInertia({ x: 0, y: 0, z: 1 });
    this.frozen = [x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z];
  }

  /**
   * The frozen world inverse inertia applied to a world vector; zero for a
   * kinematic body. It reads the matrix of the last `freezeInverseInertia`.
   *
   * @param v A world vector.
   * @returns The product, world frame, per kilogram square metre.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the matrix it reads, the frame and the kinematic zero.
   * @evidence contracts/development/implementation.md#principled-implementation A row-major matrix-vector product with the frozen map.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product; the matrix belongs to freezeInverseInertia.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kinematic zero matches inverseInertia; non-null assertions read the fixed nine entries.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: nine products.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the substep's frozen matrix instead of rotating per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public frozenInverseInertia(v: IAutoMovieVector3): IAutoMovieVector3 {
    if (!this.dynamic) return { x: 0, y: 0, z: 0 };
    const m: number[] = this.frozen;
    return {
      x: m[0]! * v.x + m[1]! * v.y + m[2]! * v.z,
      y: m[3]! * v.x + m[4]! * v.y + m[5]! * v.z,
      z: m[6]! * v.x + m[7]! * v.y + m[8]! * v.z,
    };
  }

  /**
   * The world inertia applied to a world vector, `R I R^T v`, with `R` the
   * body rotation times its inertia rotation.
   *
   * @param v A world vector.
   * @returns The product, world frame, times kilogram square metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula and its frames.
   * @evidence contracts/development/implementation.md#principled-implementation The inertia tensor is diagonal in its principal frame; the world integration reads it for the gyroscopic term `w x I w`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rotate in, scale per axis, rotate out.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one quaternion product and two rotations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per body and substep; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
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
   * @returns A fresh vector, world metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point, frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the velocity the step derives from the pose change and the velocity passes adjust.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, one fresh record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public linvel(): IAutoMovieVector3 {
    return { ...this.velocity };
  }

  /**
   * Angular velocity.
   *
   * @returns A fresh vector, world radians per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the angular velocity the step derives from the rotation change.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, one fresh record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public angvel(): IAutoMovieVector3 {
    return { ...this.angularVelocity };
  }

  /**
   * Set the centre's linear velocity; the next step integrates from it.
   *
   * @param v World metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point, frame, unit and when the value takes effect.
   * @evidence contracts/development/implementation.md#principled-implementation Stores a copy that the next integration reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; a kinematic body's velocity is re-derived from its set pose at the next step.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores a copy; retains no caller object.
   */
  public setLinvel(v: IAutoMovieVector3): void {
    this.velocity = { ...v };
  }

  /**
   * Set the angular velocity; the next step integrates from it.
   *
   * @param w World radians per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and when the value takes effect.
   * @evidence contracts/development/implementation.md#principled-implementation Stores a copy that the next integration reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; a kinematic body's velocity is re-derived from its set pose at the next step.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores a copy; retains no caller object.
   */
  public setAngvel(w: IAutoMovieVector3): void {
    this.angularVelocity = { ...w };
  }

  /**
   * The velocity of the material point at a world position: `v + w x (p - c)`.
   *
   * @param point World metres.
   * @returns World metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula, frame and units.
   * @evidence contracts/development/implementation.md#principled-implementation The rigid-body velocity field: the centre's velocity plus the angular velocity crossed with the offset from the centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression over the body's state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; any point is treated as rigidly attached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read per point; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the linear and angular updates, units, frames and the kinematic case.
   * @evidence contracts/development/implementation.md#principled-implementation Newton-Euler impulse response: the impulse changes linear momentum and its moment about the centre changes angular momentum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two updates through inverseMass and inverseInertia.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kinematic return matches its zero inverse mass and inertia.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores fresh velocity records; retains no caller object.
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
   * Accumulate a force at the centre of mass; it acts through the next
   * integration and stays until `resetForces`.
   *
   * @param force World newtons.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point, frame, unit and the accumulation's lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Forces on one rigid body at its centre sum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One addition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; the world's integration ignores the wrench of a kinematic body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one summed vector; retains no caller object.
   */
  public addForce(force: IAutoMovieVector3): void {
    this.force = Vector3.add(this.force, force);
  }

  /**
   * Accumulate a torque; it acts through the next integration and stays
   * until `resetTorques`.
   *
   * @param torque World newton metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and the accumulation's lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Torques on one rigid body sum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One addition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; the world's integration ignores the wrench of a kinematic body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one summed vector; retains no caller object.
   */
  public addTorque(torque: IAutoMovieVector3): void {
    this.torque = Vector3.add(this.torque, torque);
  }

  /**
   * Accumulate a force at a world point: the force at the centre plus its moment about it.
   *
   * @param force World newtons.
   * @param point World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the decomposition, frames and units.
   * @evidence contracts/development/implementation.md#principled-implementation A force off the centre is equivalent to the same force at the centre plus the torque `(p - c) x f`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to addForce and addTorque.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only the summed wrench; retains no caller object.
   */
  public addForceAtPoint(
    force: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): void {
    this.addForce(force);
    this.addTorque(Vector3.cross(Vector3.subtract(point, this.center), force));
  }

  /**
   * Clear the accumulated force to zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidence contracts/development/implementation.md#principled-implementation Ends the accumulation the owner started with addForce.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Releases the accumulated force.
   */
  public resetForces(): void {
    this.force = { x: 0, y: 0, z: 0 };
  }

  /**
   * Clear the accumulated torque to zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidence contracts/development/implementation.md#principled-implementation Ends the accumulation the owner started with addTorque.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Releases the accumulated torque.
   */
  public resetTorques(): void {
    this.torque = { x: 0, y: 0, z: 0 };
  }

  /**
   * The accumulated force.
   *
   * @returns A fresh vector, world newtons.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and that the result is a fresh copy.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the sum addForce and addForceAtPoint accumulated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, one fresh record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public userForce(): IAutoMovieVector3 {
    return { ...this.force };
  }

  /**
   * The accumulated torque.
   *
   * @returns A fresh vector, world newton metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and that the result is a fresh copy.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the sum addTorque and addForceAtPoint accumulated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, one fresh record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public userTorque(): IAutoMovieVector3 {
    return { ...this.torque };
  }

  /**
   * Whether forces and corrections move the body.
   *
   * @returns True for a dynamic body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the flag means.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the body's kind.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A read of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean; retains nothing.
   */
  public isDynamic(): boolean {
    return this.dynamic;
  }

  /**
   * Whether the body follows set poses.
   *
   * @returns True for a kinematic body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the flag means.
   * @evidence contracts/development/implementation.md#principled-implementation The negation of the body's kind: a body is either dynamic or kinematic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A read of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean; retains nothing.
   */
  public isKinematic(): boolean {
    return !this.dynamic;
  }

  /**
   * Make the body dynamic or kinematic, keeping its pose and velocities and
   * dropping any set kinematic pose.
   *
   * @param dynamic Whether it becomes dynamic.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the switch keeps and drops.
   * @evidence contracts/development/implementation.md#principled-implementation A set kinematic pose belongs to the kind being left, so the switch clears it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two field writes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Releases the set kinematic pose.
   */
  public setDynamic(dynamic: boolean): void {
    this.dynamic = dynamic;
    this.next = undefined;
  }

  /**
   * Move the body frame's origin, keeping its rotation and velocities; the
   * previous centre follows, so the move adds no velocity at the next
   * derivation.
   *
   * @param position World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit, what is kept and the previous-centre reset.
   * @evidence contracts/development/implementation.md#principled-implementation A teleport rather than a motion, so the step history restarts at the new centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses place, then resets the previous centre.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores fresh pose records; retains no caller object.
   */
  public setTranslation(position: IAutoMovieVector3): void {
    this.place(position, this.orientation);
    this.previousCenter = { ...this.center };
  }

  /**
   * Turn the body frame about its origin, keeping its velocities; the
   * previous pose follows, so the turn adds no velocity at the next
   * derivation.
   *
   * @param rotation World rotation; normalised here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pivot, what is kept and the previous-pose reset.
   * @evidence contracts/development/implementation.md#principled-implementation A teleport rather than a motion, so the step history restarts at the new pose; the centre moves with the rotated body-frame centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses translation and place, then resets the previous pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores fresh pose records; retains no caller object.
   */
  public setRotation(rotation: IAutoMovieQuaternion): void {
    this.place(this.translation(), rotation);
    this.previousCenter = { ...this.center };
    this.previousOrientation = { ...this.orientation };
  }

  /**
   * The body-frame position a kinematic body reaches at the end of the next step.
   *
   * @returns A fresh vector, world metres; the current position when none is set.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and the fallback when no pose is set.
   * @evidence contracts/development/implementation.md#principled-implementation An unset kinematic pose holds, so the current origin is where the body will be.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  public nextTranslation(): IAutoMovieVector3 {
    return this.next ? { ...this.next.position } : this.translation();
  }

  /**
   * The rotation a kinematic body reaches at the end of the next step.
   *
   * @returns A fresh unit quaternion; the current rotation when none is set.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the fallback when no pose is set.
   * @evidence contracts/development/implementation.md#principled-implementation An unset kinematic pose holds, so the current rotation is where the body will be.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A copy of current state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh quaternion; retains nothing.
   */
  public nextRotation(): IAutoMovieQuaternion {
    return this.next ? { ...this.next.rotation } : this.rotation();
  }

  /**
   * Set the body-frame position a kinematic body reaches at the end of the
   * next step; the set rotation, or the current one, is kept. The step
   * consumes the pose.
   *
   * @param position World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit, the kept rotation and that the step consumes the pose.
   * @evidence contracts/development/implementation.md#principled-implementation The world's integration places a kinematic body at its set pose and derives its velocities from the change.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record write that keeps the other half of the pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; a dynamic body's set pose is ignored by the step and dropped by setDynamic.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one pose until the next step consumes it; retains no caller object.
   */
  public setNextKinematicTranslation(position: IAutoMovieVector3): void {
    this.next = {
      position: { ...position },
      rotation: this.next?.rotation ?? this.rotation(),
    };
  }

  /**
   * Set the rotation a kinematic body reaches at the end of the next step;
   * the set position, or the current one, is kept. The step consumes the
   * pose.
   *
   * @param rotation World rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the kept position and that the step consumes the pose.
   * @evidence contracts/development/implementation.md#principled-implementation The world's integration places a kinematic body at its set pose and derives its velocities from the change.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record write that keeps the other half of the pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; a dynamic body's set pose is ignored by the step and dropped by setDynamic.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one pose until the next step consumes it; retains no caller object.
   */
  public setNextKinematicRotation(rotation: IAutoMovieQuaternion): void {
    this.next = {
      position: this.next?.position ?? this.translation(),
      rotation: { ...rotation },
    };
  }
}
