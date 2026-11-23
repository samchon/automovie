import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdCollider } from "./AutoMovieXpbdCollider";
import { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import type { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The complete state of an extended position-based dynamics world
 * (`AutoMovieXpbdWorld`) as plain data: its settings and next handle, and every
 * body's pose, previous pose, velocities, mass properties, wrench and set
 * kinematic pose, every collider's body, shape and material and every joint's
 * bodies, profile joint and motors, in creation order. Writing then reading
 * reproduces every float64 value and handle, so a restored world continues bit
 * for bit.
 */
export namespace AutoMovieXpbdSnapshot {
  /** A world's complete state, as `AutoMovieXpbdWorld.takeSnapshot` records it. */
  export interface IState {
    /** World gravity. */
    gravity: IAutoMovieVector3;

    /** Substep, allowed error, contact frequency and the next handle. */
    settings: [number, number, number, number];

    /** Every body's state. */
    bodies: IBodyState[];

    /** Every collider's body handle, shape and material. */
    colliders: IColliderState[];

    /** Every joint's bodies, profile joint and motors. */
    joints: IJointState[];

    /** The last step's contacts, which controllers read before the next step. */
    contacts: IContactState[];

    /** Each articulation's warm active sets, by root body handle. */
    activeSets: IActiveSetState[];
  }

  /** One articulation's warm active sets in a snapshot. */
  export interface IActiveSetState {
    /** The root body's handle. */
    body: number;

    /** Level one's active keys. */
    first: string[];

    /** Level two's active keys. */
    second: string[];
  }

  /** One body's state in a snapshot. */
  export interface IBodyState {
    /** Handle. */
    handle: number;

    /** Whether dynamic. */
    dynamic: boolean;

    /**
     * Centre, rotation, previous centre and rotation, velocities, mass
     * properties and wrench.
     */
    values: number[];

    /** The set kinematic pose, if any. */
    next: IAutoMovieRigidTransform | null;
  }

  /** One collider's state in a snapshot. */
  export interface IColliderState {
    /** Handle. */
    handle: number;

    /** Its body's handle. */
    body: number;

    /** Its shape. */
    shape: IAutoMoviePhysicalShape;

    /** Friction, restitution and sensor flag. */
    material: [number, number, boolean];
  }

  /** One joint's state in a snapshot. */
  export interface IJointState {
    /** Handle. */
    handle: number;

    /** Parent and child body handles. */
    bodies: [number, number];

    /** The profile joint. */
    joint: IAutoMoviePhysicalJoint;

    /** Motors by axis. */
    motors: [string, AutoMovieXpbdJoint.IMotor][];
  }

  /** One contact of the last step in a snapshot. */
  export interface IContactState extends Omit<
    solveXpbdContacts.IContact,
    "a" | "b"
  > {
    /** The first collider's handle. */
    a: number;

    /** The second collider's handle. */
    b: number;
  }

  /**
   * A world's complete state.
   *
   * @param world The world.
   * @returns Its state: settings, then every body, collider and joint in
   *   creation order.
   */
  export function write(world: AutoMovieXpbdWorld): IState {
    return {
      gravity: { ...world.gravity },
      settings: [
        world.timestep,
        world.allowedError,
        world.contactFrequency,
        Math.max(
          0,
          ...world.bodies.map(
            (body: AutoMovieXpbdBody): number => body.handle + 1,
          ),
          ...world.colliders.map(
            (collider: AutoMovieXpbdCollider): number => collider.handle + 1,
          ),
          ...world.joints.map(
            (joint: AutoMovieXpbdJoint): number => joint.handle + 1,
          ),
        ),
      ],
      bodies: world.bodies.map(
        (body: AutoMovieXpbdBody): IBodyState => ({
          handle: body.handle,
          dynamic: body.dynamic,
          values: [
            ...vector(body.center),
            ...quaternion(body.orientation),
            ...vector(body.previousCenter),
            ...quaternion(body.previousOrientation),
            ...vector(body.velocity),
            ...vector(body.angularVelocity),
            body.bodyMass,
            ...vector(body.centerOfMass),
            ...vector(body.inertia),
            ...quaternion(body.inertiaRotation),
            body.gravityScale,
            ...vector(body.force),
            ...vector(body.torque),
          ],
          next: body.next === undefined ? null : structuredClone(body.next),
        }),
      ),
      colliders: world.colliders.map(
        (collider: AutoMovieXpbdCollider): IColliderState => ({
          handle: collider.handle,
          body: collider.body.handle,
          shape: structuredClone(collider.shape),
          material: [collider.friction, collider.restitution, collider.sensor],
        }),
      ),
      joints: world.joints.map(
        (joint: AutoMovieXpbdJoint): IJointState => ({
          handle: joint.handle,
          bodies: [joint.parent.handle, joint.child.handle],
          joint: structuredClone(joint.joint),
          motors: [...joint.motors].map(
            ([axis, motor]: [string, AutoMovieXpbdJoint.IMotor]): [
              string,
              AutoMovieXpbdJoint.IMotor,
            ] => [axis, { ...motor }],
          ),
        }),
      ),
      contacts: world.lastContacts().map(
        (contact: solveXpbdContacts.IContact): IContactState => ({
          ...structuredClone({ ...contact, a: undefined, b: undefined }),
          a: contact.a.handle,
          b: contact.b.handle,
        }),
      ),
      activeSets: [...world.activeSets].map(
        ([body, warm]: [
          AutoMovieXpbdBody,
          solveXpbdSupportCascade.IWarm,
        ]): IActiveSetState => ({
          body: body.handle,
          first: [...warm.first],
          second: [...warm.second],
        }),
      ),
    };
  }

  /**
   * Fill an empty world with a state, giving every body, collider and joint its
   * recorded handle in the recorded order.
   *
   * @param state The state.
   * @param world An empty world built with the state's gravity.
   */
  export function read(state: IState, world: AutoMovieXpbdWorld): void {
    [world.timestep, world.allowedError, world.contactFrequency] =
      state.settings;
    const bodies: Map<number, AutoMovieXpbdBody> = new Map();
    for (const entry of state.bodies) {
      const v: number[] = entry.values;
      const body: AutoMovieXpbdBody = new AutoMovieXpbdBody(
        entry.handle,
        entry.dynamic,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0, w: 1 },
      );
      body.center = { x: v[0]!, y: v[1]!, z: v[2]! };
      body.orientation = { x: v[3]!, y: v[4]!, z: v[5]!, w: v[6]! };
      body.previousCenter = { x: v[7]!, y: v[8]!, z: v[9]! };
      body.previousOrientation = { x: v[10]!, y: v[11]!, z: v[12]!, w: v[13]! };
      body.velocity = { x: v[14]!, y: v[15]!, z: v[16]! };
      body.angularVelocity = { x: v[17]!, y: v[18]!, z: v[19]! };
      body.bodyMass = v[20]!;
      body.centerOfMass = { x: v[21]!, y: v[22]!, z: v[23]! };
      body.inertia = { x: v[24]!, y: v[25]!, z: v[26]! };
      body.inertiaRotation = { x: v[27]!, y: v[28]!, z: v[29]!, w: v[30]! };
      body.gravityScale = v[31]!;
      body.force = { x: v[32]!, y: v[33]!, z: v[34]! };
      body.torque = { x: v[35]!, y: v[36]!, z: v[37]! };
      body.next = entry.next ?? undefined;
      world.bodies.push(body);
      bodies.set(entry.handle, body);
    }
    for (const entry of state.colliders)
      world.colliders.push(
        new AutoMovieXpbdCollider(
          entry.handle,
          bodies.get(entry.body)!,
          entry.shape,
          entry.material[0],
          entry.material[1],
          entry.material[2],
        ),
      );
    for (const entry of state.joints) {
      const joint: AutoMovieXpbdJoint = new AutoMovieXpbdJoint(
        entry.handle,
        bodies.get(entry.bodies[0])!,
        bodies.get(entry.bodies[1])!,
        entry.joint,
      );
      for (const [axis, motor] of entry.motors) joint.motors.set(axis, motor);
      world.joints.push(joint);
    }
    const colliders: Map<number, AutoMovieXpbdCollider> = new Map(
      world.colliders.map(
        (collider: AutoMovieXpbdCollider): [number, AutoMovieXpbdCollider] => [
          collider.handle,
          collider,
        ],
      ),
    );
    world.adoptContacts(
      state.contacts.map(
        (entry: IContactState): solveXpbdContacts.IContact => ({
          ...entry,
          a: colliders.get(entry.a)!,
          b: colliders.get(entry.b)!,
        }),
      ),
    );
    for (const entry of state.activeSets)
      world.activeSets.set(bodies.get(entry.body)!, {
        first: [...entry.first],
        second: [...entry.second],
      });
    world.resume(state.settings[3]);
  }

  /**
   * The JSON replacer that keeps a negative zero, which JSON writes as zero: it
   * becomes the marker string, every other value passes through.
   *
   * @param _key The property name.
   * @param value The value.
   * @returns The value or the marker.
   */
  export function replace(_key: string, value: unknown): unknown {
    return Object.is(value, -0) ? NEGATIVE_ZERO : value;
  }

  /**
   * The JSON reviver that restores the negative zero `replace` marked.
   *
   * @param _key The property name.
   * @param value The parsed value.
   * @returns The value, or negative zero for the marker.
   */
  export function revive(_key: string, value: unknown): unknown {
    return value === NEGATIVE_ZERO ? -0 : value;
  }
}

/** A vector's components. */
function vector(v: IAutoMovieVector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

/** A quaternion's components. */
function quaternion(q: IAutoMovieQuaternion): [number, number, number, number] {
  return [q.x, q.y, q.z, q.w];
}

/**
 * The marker a negative zero becomes in snapshot JSON; no shape or joint
 * identity begins with a NUL.
 */
const NEGATIVE_ZERO: string = "\u0000-0";
