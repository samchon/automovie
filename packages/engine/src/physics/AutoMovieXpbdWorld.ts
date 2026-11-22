import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdCollider } from "./AutoMovieXpbdCollider";
import { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdSnapshot } from "./AutoMovieXpbdSnapshot";
import { solveXpbdContacts } from "./solveXpbdContacts";
import { solveXpbdJoints } from "./solveXpbdJoints";

/**
 * The engine's rigid-body world: extended position-based dynamics in plain
 * TypeScript (Mueller, Macklin, Chentanez, Jeschke and Kim 2020, "Detailed
 * Rigid Body Simulation with Extended Position Based Dynamics", SCA,
 * Algorithm 2; compliance from Macklin, Mueller and Chentanez 2016).
 *
 * One `step` advances one substep `timestep`: dynamic bodies integrate
 * their velocities under gravity and their accumulated wrench (with the
 * gyroscopic term `w x I w`) and predict their poses; kinematic bodies
 * move to the pose set for the step's end; contacts are detected at the
 * predicted poses; `passes * sweeps` sweeps then correct the joints and
 * the contacts; velocities are re-derived from the pose change,
 * `v = dx / h`, `w = 2 vec(dq q^-1) / h`; and the velocity passes, as many as the position passes, apply dynamic
 * friction and restitution before the joints' motors. Every loop runs in
 * creation order over plain float64 state, so a world given the same
 * inputs repeats every bit; `takeSnapshot` copies that state and
 * `restoreSnapshot` rebuilds it in the same order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the substep's phases with their formulas, the determinism and the snapshot.
 * @evidence contracts/development/design.md#principled-representation SI units, world frame, one substep per step; bodies, colliders and joints keep creation order and integer handles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine's physical simulation, which binds, tracks, reads and checkpoints it; the members are what those owners use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient is an input: gravity, substep, passes, sweeps, allowed contact error and contact frequency.
 */
export class AutoMovieXpbdWorld {
  /** World gravitational acceleration, metres per second squared. */
  public readonly gravity: IAutoMovieVector3;

  /** Bodies in creation order. */
  public readonly bodies: AutoMovieXpbdBody[] = [];

  /** Colliders in creation order. */
  public readonly colliders: AutoMovieXpbdCollider[] = [];

  /** Joints in creation order. */
  public readonly joints: AutoMovieXpbdJoint[] = [];

  /** The substep, seconds. */
  public timestep: number = 1 / 60;

  /** Constraint passes per substep. */
  public passes: number = 4;

  /** Sweeps of every constraint within one pass. */
  public sweeps: number = 1;

  /** Contact depth left uncorrected, metres. */
  public allowedError: number = 0.001;

  /** Natural frequency of the contact spring, hertz. */
  public contactFrequency: number = 30;

  /** The last step's contacts, sensors included. */
  private found: solveXpbdContacts.IContact[] = [];

  /** The next handle. */
  private counter: number = 0;

  /**
   * Create an empty world.
   *
   * @param gravity World gravitational acceleration, metres per second squared.
   */
  public constructor(gravity: IAutoMovieVector3) {
    this.gravity = { ...gravity };
  }

  /**
   * Add a body.
   *
   * @param dynamic Whether forces and corrections move it.
   * @param pose Its body frame's world pose.
   * @param gravityScale Multiplier on world gravity.
   * @returns The body.
   */
  public createBody(
    dynamic: boolean,
    pose: IAutoMovieRigidTransform,
    gravityScale: number = 1,
  ): AutoMovieXpbdBody {
    const body: AutoMovieXpbdBody = new AutoMovieXpbdBody(
      this.counter++,
      dynamic,
      pose.position,
      pose.rotation,
    );
    body.gravityScale = gravityScale;
    this.bodies.push(body);
    return body;
  }

  /**
   * Add a collider to a body.
   *
   * @param body The body.
   * @param shape The shape, its transform in the body frame.
   * @param friction Coulomb friction coefficient.
   * @param restitution Restitution coefficient.
   * @param sensor Whether it only reports overlaps.
   * @returns The collider.
   */
  public createCollider(
    body: AutoMovieXpbdBody,
    shape: IAutoMoviePhysicalShape,
    friction: number,
    restitution: number,
    sensor: boolean,
  ): AutoMovieXpbdCollider {
    const collider: AutoMovieXpbdCollider = new AutoMovieXpbdCollider(
      this.counter++,
      body,
      shape,
      friction,
      restitution,
      sensor,
    );
    this.colliders.push(collider);
    return collider;
  }

  /**
   * Join two bodies; the joined pair never collides.
   *
   * @param joint The profile's joint.
   * @param parent The parent body.
   * @param child The child body.
   * @returns The joint.
   */
  public createJoint(
    joint: IAutoMoviePhysicalJoint,
    parent: AutoMovieXpbdBody,
    child: AutoMovieXpbdBody,
  ): AutoMovieXpbdJoint {
    const created: AutoMovieXpbdJoint = new AutoMovieXpbdJoint(
      this.counter++,
      parent,
      child,
      joint,
    );
    this.joints.push(created);
    return created;
  }

  /**
   * Advance one substep.
   *
   * @param filter Whether two colliders may touch; every pair when absent.
   */
  public step(filter?: solveXpbdContacts.Filter): void {
    const h: number = this.timestep;
    for (const body of this.bodies) this.integrate(body, h);
    const joined: Set<string> = new Set(
      this.joints.map((joint: AutoMovieXpbdJoint): string =>
        key(joint.parent, joint.child),
      ),
    );
    this.found = solveXpbdContacts.detect(
      this.colliders,
      (a: AutoMovieXpbdCollider, b: AutoMovieXpbdCollider): boolean =>
        !joined.has(key(a.body, b.body)) &&
        (filter === undefined || filter(a, b)),
      this.allowedError,
    );
    const dynamic: AutoMovieXpbdBody[] = this.bodies.filter(
      (body: AutoMovieXpbdBody): boolean => body.dynamic,
    );
    const passes: number =
      this.passes +
      Math.max(
        0,
        ...dynamic.map((body: AutoMovieXpbdBody): number => body.extraPasses),
      );
    const sweeps: number =
      this.sweeps +
      Math.max(
        0,
        ...dynamic.map((body: AutoMovieXpbdBody): number => body.extraSweeps),
      );
    for (let pass: number = 0; pass < passes * sweeps; pass++) {
      solveXpbdJoints.positions(this.joints);
      solveXpbdContacts.positions(
        this.found,
        h,
        this.allowedError,
        this.contactFrequency,
      );
    }
    for (const body of dynamic) derive(body, h);
    for (let pass: number = 0; pass < passes * sweeps; pass++)
      solveXpbdContacts.velocities(this.found, h, Vector3.length(this.gravity));
    solveXpbdJoints.motors(this.joints, h);
  }

  /**
   * The last step's touching pairs that responded, one manifold each:
   * non-sensor pairs with their normal from the first collider toward the
   * second and every patch point's world witness midpoint, end-of-step
   * separation and normal impulse.
   *
   * @returns The manifolds, in pair order.
   */
  public manifolds(): AutoMovieXpbdWorld.IManifold[] {
    const result: AutoMovieXpbdWorld.IManifold[] = [];
    for (const contact of this.found) {
      if (contact.a.sensor || contact.b.sensor) continue;
      let manifold: AutoMovieXpbdWorld.IManifold | undefined =
        result[result.length - 1];
      if (manifold === undefined || manifold.pair !== contact.pair) {
        manifold = {
          pair: contact.pair,
          a: contact.a,
          b: contact.b,
          normal: { ...contact.normal },
          friction: contact.friction,
          points: [],
        };
        result.push(manifold);
      }
      manifold.points.push({
        point: Vector3.scale(
          Vector3.add(
            Vector3.add(
              contact.a.body.center,
              Quaternion.rotateVector(
                contact.a.body.orientation,
                contact.localA,
              ),
            ),
            Vector3.add(
              contact.b.body.center,
              Quaternion.rotateVector(
                contact.b.body.orientation,
                contact.localB,
              ),
            ),
          ),
          0.5,
        ),
        separation: contact.separation,
        impulse: contact.normalLambda / this.timestep,
      });
    }
    return result;
  }
  /**
   * The last step's overlaps involving a sensor collider.
   *
   * @returns Each overlapping pair, in pair order.
   */
  public intersections(): AutoMovieXpbdWorld.IIntersection[] {
    return this.found
      .filter(
        (contact: solveXpbdContacts.IContact): boolean =>
          contact.a.sensor || contact.b.sensor,
      )
      .map(
        (
          contact: solveXpbdContacts.IContact,
        ): AutoMovieXpbdWorld.IIntersection => ({
          a: contact.a,
          b: contact.b,
        }),
      );
  }

  /**
   * Copy the world's complete state.
   *
   * @returns Owned bytes: the UTF-8 JSON of every body, collider, joint and setting in creation order.
   */
  public takeSnapshot(): Uint8Array {
    return new TextEncoder().encode(
      JSON.stringify(AutoMovieXpbdSnapshot.write(this)),
    );
  }

  /**
   * Rebuild a world from its snapshot, with the same handles in the same order.
   *
   * @param bytes A snapshot's bytes.
   * @returns The world.
   */
  public static restoreSnapshot(bytes: Uint8Array): AutoMovieXpbdWorld {
    const state: AutoMovieXpbdSnapshot.IState = JSON.parse(
      new TextDecoder().decode(bytes),
    );
    const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(state.gravity);
    AutoMovieXpbdSnapshot.read(state, world);
    return world;
  }

  /**
   * Continue handle numbering after a restore.
   *
   * @param next The next handle to give.
   */
  public resume(next: number): void {
    this.counter = next;
  }

  /** Integrate one body's velocities and predict its pose; carry a kinematic body to its set pose. */
  private integrate(body: AutoMovieXpbdBody, h: number): void {
    body.previousCenter = { ...body.center };
    body.previousOrientation = { ...body.orientation };
    if (!body.dynamic) {
      if (body.next !== undefined) {
        body.place(body.next.position, body.next.rotation);
        body.next = undefined;
      }
      derive(body, h);
      return;
    }
    const m: number = body.mass();
    body.velocity = Vector3.add(
      body.velocity,
      Vector3.scale(
        Vector3.add(
          Vector3.scale(this.gravity, body.gravityScale),
          m > 0 ? Vector3.scale(body.force, 1 / m) : { x: 0, y: 0, z: 0 },
        ),
        h,
      ),
    );
    const spin: IAutoMovieVector3 = body.angularVelocity;
    body.angularVelocity = Vector3.add(
      spin,
      Vector3.scale(
        body.inverseInertia(
          Vector3.subtract(
            body.torque,
            Vector3.cross(spin, body.worldInertia(spin)),
          ),
        ),
        h,
      ),
    );
    body.center = Vector3.add(body.center, Vector3.scale(body.velocity, h));
    const w: IAutoMovieVector3 = Vector3.scale(body.angularVelocity, 0.5 * h);
    const q: IAutoMovieQuaternion = body.orientation;
    const dq: IAutoMovieQuaternion = Quaternion.multiply(
      { x: w.x, y: w.y, z: w.z, w: 0 },
      q,
    );
    body.orientation = Quaternion.normalize({
      x: q.x + dq.x,
      y: q.y + dq.y,
      z: q.z + dq.z,
      w: q.w + dq.w,
    });
  }
}

/** Companion types of {@link AutoMovieXpbdWorld}. */
export namespace AutoMovieXpbdWorld {
  /** A responding pair of the last step. */
  export interface IManifold {
    /** Index of the pair among the step's touching pairs. */
    pair: number;

    /** The first collider. */
    a: AutoMovieXpbdCollider;

    /** The second collider. */
    b: AutoMovieXpbdCollider;

    /** Unit world normal from the first collider toward the second. */
    normal: IAutoMovieVector3;

    /** Combined Coulomb friction coefficient the pair's contacts used this step. */
    friction: number;

    /** The patch points. */
    points: IManifoldPoint[];
  }

  /** One point of a responding manifold. */
  export interface IManifoldPoint {
    /** World midpoint of the two witnesses, metres. */
    point: IAutoMovieVector3;

    /** Signed distance at the end of the step, metres; negative pressing. */
    separation: number;

    /** Normal impulse of the step, newton seconds. */
    impulse: number;
  }

  /** An overlap involving a sensor collider. */
  export interface IIntersection {
    /** The first collider. */
    a: AutoMovieXpbdCollider;

    /** The second collider. */
    b: AutoMovieXpbdCollider;
  }
}

/** An unordered body-pair key. */
function key(a: AutoMovieXpbdBody, b: AutoMovieXpbdBody): string {
  return a.handle < b.handle
    ? `${a.handle}:${b.handle}`
    : `${b.handle}:${a.handle}`;
}

/** Re-derive a body's velocities from its pose change over the substep. */
function derive(body: AutoMovieXpbdBody, h: number): void {
  body.velocity = Vector3.scale(
    Vector3.subtract(body.center, body.previousCenter),
    1 / h,
  );
  const dq: IAutoMovieQuaternion = Quaternion.multiply(
    body.orientation,
    Quaternion.inverse(body.previousOrientation),
  );
  const sign: number = dq.w < 0 ? -1 : 1;
  body.angularVelocity = {
    x: (2 * sign * dq.x) / h,
    y: (2 * sign * dq.y) / h,
    z: (2 * sign * dq.z) / h,
  };
}
