import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdCollider } from "./AutoMovieXpbdCollider";
import { AutoMovieXpbdIntegration } from "./AutoMovieXpbdIntegration";
import { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdSnapshot } from "./AutoMovieXpbdSnapshot";
import { readXpbdManifolds } from "./readXpbdManifolds";
import { respondXpbdArticulation } from "./respondXpbdArticulation";
import { solveXpbdContactVelocities } from "./solveXpbdContactVelocities";
import { solveXpbdContacts } from "./solveXpbdContacts";
import { solveXpbdJoints } from "./solveXpbdJoints";
import type { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The engine's rigid-body world: extended position-based dynamics in plain
 * TypeScript (Mueller, Macklin, Chentanez, Jeschke and Kim 2020, "Detailed
 * Rigid Body Simulation with Extended Position Based Dynamics", SCA, Algorithm
 * 2; compliance from Macklin, Mueller and Chentanez 2016).
 *
 * One `step` advances one substep `timestep`: dynamic bodies integrate their
 * velocities under gravity and their accumulated wrench (with the gyroscopic
 * term `w x I w`) and predict their poses; kinematic bodies move to the pose
 * set for the step's end; contacts are detected at the predicted poses; one
 * position pass corrects the joints and the contacts; velocities are re-derived
 * from the pose change, `v = dx / h`, `w = 2 vec(dq q^-1) / h`; and one
 * velocity pass applies dynamic friction and restitution before the joints'
 * motors, which act over each articulation. Accuracy comes from substeps, not
 * passes (Macklin, Storey, Lu, Terdiman, Chentanez, Jeschke and Mueller 2019,
 * "Small Steps in Physics Simulation"; Mueller et al. 2020 use one iteration
 * per substep). Every loop runs in creation order over plain float64 state, so
 * a world given the same inputs repeats every bit; `takeSnapshot` copies that
 * state and `restoreSnapshot` rebuilds it in the same order.
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

  /** Contact depth left uncorrected, metres. */
  public allowedError: number = 0.001;

  /** Natural frequency of the contact spring, hertz. */
  public contactFrequency: number = 30;

  /** The last step's contacts, sensors included. */
  private found: solveXpbdContacts.IContact[] = [];

  /**
   * The ground-reaction wrench each articulation's root controller asks of its
   * supports this step, keyed by the root body: set by the controllers before
   * `step`, read by the motors' solve and cleared by `step`.
   */
  public readonly rootTasks: Map<
    AutoMovieXpbdBody,
    AutoMovieXpbdWorld.IRootTask
  > = new Map();

  /**
   * Each articulation's active sets from its last support cascade, keyed by the
   * root body: the warm start of the next substep's solve, kept across steps
   * and in snapshots so a restored world continues bit for bit.
   */
  public readonly activeSets: Map<
    AutoMovieXpbdBody,
    solveXpbdSupportCascade.IWarm
  > = new Map();

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
   * Add a body with the next handle, at the end of the creation order. Its mass
   * properties are zero until `setMass`.
   *
   * @param dynamic Whether forces and corrections move it.
   * @param pose Its body frame's world pose, metres.
   * @param gravityScale Multiplier on world gravity; 1 by default.
   * @returns The body, owned by the world.
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
   * Add a collider to a body with the next handle, at the end of the creation
   * order.
   *
   * @param body The body, one of this world's.
   * @param shape The shape, its transform in the body frame; held, not copied.
   * @param friction Coulomb friction coefficient.
   * @param restitution Restitution coefficient.
   * @param sensor Whether it only reports overlaps.
   * @returns The collider, owned by the world.
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
   * Join two bodies with the next handle, at the end of the creation order; the
   * joined pair never collides.
   *
   * @param joint The profile's joint; held, not copied.
   * @param parent The parent body, one of this world's.
   * @param child The child body, one of this world's.
   * @returns The joint, owned by the world.
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
   * Advance one substep of `timestep` seconds: integrate every body and freeze
   * each dynamic body's inverse inertia, detect contacts at the predicted poses
   * among pairs neither joined nor filtered out, run one joint and contact
   * position pass, re-derive the dynamic bodies' velocities, run one contact
   * velocity pass and finally the joint motors over each articulation. The step
   * keeps the contacts it found for the readers until the next step.
   *
   * @param filter Whether two colliders may touch; every pair when absent.
   */
  public step(filter?: solveXpbdContacts.Filter): void {
    const h: number = this.timestep;
    for (const body of this.bodies) {
      AutoMovieXpbdIntegration.predict(body, this.gravity, h);
      if (body.dynamic) body.freezeInverseInertia();
    }
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
    solveXpbdJoints.positions(this.joints, h);
    // The contacts' corrections move each jointed body's whole tree along
    // its joints' free axes (`respondXpbdArticulation`), so a contact
    // no longer pulls a body off its joints after the joints' pass.
    solveXpbdContacts.positions(
      this.found,
      h,
      this.allowedError,
      this.contactFrequency,
      respondXpbdArticulation(this.joints, this.found),
    );
    for (const body of dynamic) AutoMovieXpbdIntegration.derive(body, h);
    solveXpbdContactVelocities(this.found, h, Vector3.length(this.gravity));
    solveXpbdJoints.motors(
      this.joints,
      h,
      this.found,
      this.rootTasks,
      this.activeSets,
    );
    this.rootTasks.clear();
  }

  /**
   * The last step's touching pairs that responded, one manifold each, as
   * `readXpbdManifolds` reads them.
   *
   * @returns Fresh manifolds, in pair order; their colliders are the world's.
   */
  public manifolds(): AutoMovieXpbdWorld.IManifold[] {
    return readXpbdManifolds(this.found, this.timestep);
  }

  /**
   * The last step's overlaps involving a sensor collider.
   *
   * @returns Each overlapping pair, in pair order, as fresh records of the
   *   world's colliders.
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
   * Copy the world's complete state, the last step's contacts included.
   *
   * @returns Owned bytes: the UTF-8 JSON of every body, collider, joint and
   *   setting in creation order, negative zeros marked so they survive.
   */
  public takeSnapshot(): Uint8Array {
    return new TextEncoder().encode(
      JSON.stringify(
        AutoMovieXpbdSnapshot.write(this),
        AutoMovieXpbdSnapshot.replace,
      ),
    );
  }

  /**
   * Rebuild a world from its snapshot, with the same handles in the same order,
   * the same last-step contacts and the next handle continued.
   *
   * @param bytes A snapshot's bytes, as `takeSnapshot` wrote them.
   * @returns A new world.
   */
  public static restoreSnapshot(bytes: Uint8Array): AutoMovieXpbdWorld {
    const state: AutoMovieXpbdSnapshot.IState = JSON.parse(
      new TextDecoder().decode(bytes),
      AutoMovieXpbdSnapshot.revive,
    );
    const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(state.gravity);
    AutoMovieXpbdSnapshot.read(state, world);
    return world;
  }

  /**
   * The last step's contacts, sensors included, as the step left them.
   *
   * @returns The world's own records, read-only; a snapshot copies them.
   */
  public lastContacts(): readonly solveXpbdContacts.IContact[] {
    return this.found;
  }

  /**
   * Adopt a restored step's contacts as the last step's, which the readers then
   * report until the next step.
   *
   * @param contacts The contacts, their colliders this world's; held, not
   *   copied.
   */
  public adoptContacts(contacts: solveXpbdContacts.IContact[]): void {
    this.found = contacts;
  }

  /**
   * Continue handle numbering after a restore.
   *
   * @param next The next handle to give: one past the largest restored handle.
   */
  public resume(next: number): void {
    this.counter = next;
  }
}

/** Companion types of {@link AutoMovieXpbdWorld}. */
export namespace AutoMovieXpbdWorld {
  /**
   * A root task: the wrench an articulation's supports should give its root
   * this step, the floating base's momentum task of whole-body control (Herzog,
   * Rotella, Mason, Grimminger, Schaal and Righetti 2016; Wensing and Orin
   * 2013), produced through the joints and the ground.
   */
  export interface IRootTask {
    /** The point the moment is taken about, world metres. */
    origin: IAutoMovieVector3;

    /** The requested force, newtons. */
    force: IAutoMovieVector3;

    /** The requested moment about the origin, newton metres. */
    torque: IAutoMovieVector3;
  }

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

    /**
     * Signed distance where the step found the contact, metres; negative
     * pressing.
     */
    separation: number;

    /**
     * Normal impulse the step transferred, newton seconds: the position passes'
     * multiplier over the substep plus the velocity passes' impulse.
     */
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
