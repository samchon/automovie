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
   * Add a body with the next handle, at the end of the creation order. Its
   * mass properties are zero until `setMass`.
   *
   * @param dynamic Whether forces and corrections move it.
   * @param pose Its body frame's world pose, metres.
   * @param gravityScale Multiplier on world gravity; 1 by default.
   * @returns The body, owned by the world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the handle, order, default gravity scale, unset mass and ownership.
   * @evidence contracts/development/implementation.md#principled-implementation One handle counter for bodies, colliders and joints keeps handles unique in the world, and creation order is the order every step loop follows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Constructs the body and appends it; mass properties are the caller's to set.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Amortised constant work: one append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call creates a distinct body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The world holds the body for its own lifetime and has no removal; the body population grows by one per call.
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
   * Add a collider to a body with the next handle, at the end of the
   * creation order.
   *
   * @param body The body, one of this world's.
   * @param shape The shape, its transform in the body frame; held, not copied.
   * @param friction Coulomb friction coefficient.
   * @param restitution Restitution coefficient.
   * @param sensor Whether it only reports overlaps.
   * @returns The collider, owned by the world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the handle, order, the shape's frame and that it is held, and ownership.
   * @evidence contracts/development/implementation.md#principled-implementation The shared handle counter keeps handles unique; creation order is the contact detection's pair order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Constructs the collider and appends it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case; the material is stored as given.
   * @evidence contracts/development/implementation.md#efficient-algorithms Amortised constant work plus the collider's local box, linear in a hull's points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call creates a distinct collider.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The world holds the collider for its own lifetime and has no removal; the collider population grows by one per call.
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
   * Join two bodies with the next handle, at the end of the creation order;
   * the joined pair never collides.
   *
   * @param joint The profile's joint; held, not copied.
   * @param parent The parent body, one of this world's.
   * @param child The child body, one of this world's.
   * @returns The joint, owned by the world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the handle, order, the collision exclusion, that the joint record is held, and ownership.
   * @evidence contracts/development/implementation.md#principled-implementation The shared handle counter keeps handles unique; step reads the joint list to exclude joined pairs from contact detection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Constructs the joint and appends it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Amortised constant work: one append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call creates a distinct joint.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The world holds the joint for its own lifetime and has no removal; the joint population grows by one per call.
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
   * Advance one substep of `timestep` seconds: integrate every body and
   * freeze each dynamic body's inverse inertia, detect contacts at the
   * predicted poses among pairs neither joined nor filtered out, run
   * `passes * sweeps` joint and contact position passes (the bodies' largest
   * extra passes and sweeps added), re-derive the dynamic bodies'
   * velocities, run as many contact velocity passes and finally the joint
   * motors. The step keeps the contacts it found for the readers until the
   * next step.
   *
   * @param filter Whether two colliders may touch; every pair when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases in order, the pass count, the pair exclusions and what the step keeps.
   * @evidence contracts/development/implementation.md#principled-implementation The substep of Mueller et al. 2020, Algorithm 2: predict, solve positions, derive velocities, solve velocities; the inverse inertia is held fixed over the substep's corrections.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Orders the phases; integration and derivation are local helpers, contacts belong to solveXpbdContacts and joints and motors to solveXpbdJoints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every count and coefficient is a world setting or a body's own request; no body, pair or scene has its own rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms For b bodies, j joints, c colliders and k found contacts, integration is O(b), the joined-pair set O(j), detection is solveXpbdContacts.detect's cost over c colliders, and each of the passes * sweeps position and velocity passes is O(j + k).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The contacts found at the predicted poses serve every position and velocity pass of the substep and the readers after it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Replaces the retained contact list each step; the joined-pair set and dynamic list are released at return.
   */
  public step(filter?: solveXpbdContacts.Filter): void {
    const h: number = this.timestep;
    for (const body of this.bodies) {
      this.integrate(body, h);
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
   * second and every patch point's world witness midpoint, its separation
   * where the step found it and the normal impulse the step transferred
   * there: the position passes' multiplier over the substep, `lambda / h`,
   * plus the velocity passes' impulse, which together are the momentum the
   * contact gave each body.
   *
   * @returns Fresh manifolds, in pair order; their colliders are the world's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which pairs are reported, the normal's direction, each point's position, separation and impulse with units, and the order.
   * @evidence contracts/development/implementation.md#principled-implementation Each point's impulse is the momentum the step's position and velocity passes transferred, so a reader sees the step's real load; the witness midpoint is the two bodies' contact points at their current poses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass that opens a manifold whenever the pair index changes; detection and solving stay with solveXpbdContacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sensor pairs are left to intersections, which the compliant contacts read; no pair has its own rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the step's contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built on demand from the retained contacts; a caller reading twice gets equal fresh records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records; retains nothing.
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
        separation: contact.detected,
        impulse: contact.normalLambda / this.timestep + contact.velocityImpulse,
      });
    }
    return result;
  }

  /**
   * The last step's overlaps involving a sensor collider.
   *
   * @returns Each overlapping pair, in pair order, as fresh records of the world's colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which overlaps are reported and their order.
   * @evidence contracts/development/implementation.md#principled-implementation A sensor takes part in no response, so its contacts are overlaps that the compliant layers measure themselves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and one map over the retained contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the step's contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built on demand from the retained contacts.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records; retains nothing.
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
   * @returns Owned bytes: the UTF-8 JSON of every body, collider, joint and setting in creation order, negative zeros marked so they survive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the encoding, the contents, the order and the negative-zero marking.
   * @evidence contracts/development/implementation.md#principled-implementation JSON writes every finite float64 so that parsing returns the same value, and the replacer keeps the one value it loses, negative zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The state's layout belongs to AutoMovieXpbdSnapshot.write; this method encodes it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite value is rounded or dropped; a non-finite value would become null, which JSON cannot avoid.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bodies, colliders, joints, hull points and contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each snapshot is of a different moment.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns bytes the caller owns; retains nothing.
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
   * Rebuild a world from its snapshot, with the same handles in the same
   * order, the same last-step contacts and the next handle continued.
   *
   * @param bytes A snapshot's bytes, as `takeSnapshot` wrote them.
   * @returns A new world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is restored and the expected input.
   * @evidence contracts/development/implementation.md#principled-implementation Parses with the reviver that undoes the snapshot's negative-zero marker, then assigns every recorded value back, so the world continues bit for bit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Decodes here; the state's layout belongs to AutoMovieXpbdSnapshot.read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is recomputed; malformed bytes throw from the parser.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the snapshot's size.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each restore builds its own objects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a world the caller owns; retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned, that it is shared and read-only, and its snapshot reader.
   * @evidence contracts/development/implementation.md#principled-implementation Exposes the retained contacts so the snapshot records the state the next readers would see.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; no copy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the step's own list until the next step replaces it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing new; the list lives until the next step or adoption.
   */
  public lastContacts(): readonly solveXpbdContacts.IContact[] {
    return this.found;
  }

  /**
   * Adopt a restored step's contacts as the last step's, which the readers
   * then report until the next step.
   *
   * @param contacts The contacts, their colliders this world's; held, not copied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect, its lifetime and the input's premise and ownership.
   * @evidence contracts/development/implementation.md#principled-implementation A restored world reports the same last step as the world it was taken from.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field write; the snapshot rebuilds the records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the list until the next step replaces it.
   */
  public adoptContacts(contacts: solveXpbdContacts.IContact[]): void {
    this.found = contacts;
  }

  /**
   * Continue handle numbering after a restore.
   *
   * @param next The next handle to give: one past the largest restored handle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect and the value expected.
   * @evidence contracts/development/implementation.md#principled-implementation Handles stay unique when numbering continues past every restored handle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field write; the snapshot records the value.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutation; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one number.
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
  /**
   * A responding pair of the last step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pair, its normal, friction and points.
   * @evidence contracts/development/design.md#principled-representation Colliders, a unit normal, a dimensionless coefficient and points in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the simulation's contact receipts and supports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One record per pair; the points hold their own values.
   */
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

  /**
   * One point of a responding manifold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the witness midpoint, separation and impulse.
   * @evidence contracts/development/design.md#principled-representation World metres and newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read with its manifold.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Separation and impulse are the step's own values, not estimates.
   */
  export interface IManifoldPoint {
    /** World midpoint of the two witnesses, metres. */
    point: IAutoMovieVector3;

    /** Signed distance where the step found the contact, metres; negative pressing. */
    separation: number;

    /** Normal impulse the step transferred, newton seconds: the position passes' multiplier over the substep plus the velocity passes' impulse. */
    impulse: number;
  }

  /**
   * An overlap involving a sensor collider.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the overlapping pair.
   * @evidence contracts/development/design.md#principled-representation The two colliders.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the compliant contacts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No measurement is attached; the reader measures what it needs.
   */
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
