import {
  Quaternion,
  Vector3,
  advancePhysicalBalance,
  physicalBalanceSense,
  physicalIcpController,
  trackPhysicalRoot,
} from "@automovie/engine";
import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";

import { PhysicalDisturbance } from "./PhysicalDisturbance";
import { PhysicalModelFixtures } from "./PhysicalModelFixtures";
import { motionHumanBody } from "./motionHumanBody";
import { repositoryRoot } from "./repositoryRoot";

/**
 * The balance controller's recorded calls and their golden outputs, replayed
 * without a simulation: each fixture holds one disturbance case's key frames,
 * the complete inputs of `advancePhysicalBalance` and `trackPhysicalRoot` at
 * that substep and what they returned and wrote, recorded once from the
 * simulation; a replay rebuilds the bodies the controller reads and compares
 * its outputs to the recording bit for bit.
 *
 * Format (`physicalBalanceReplay/<case>.json`, one per case, `IFile`):
 *
 * - `case`, `subject` ("human" or "quad"), `outcome`, `axis`, `impulse`: the
 *   disturbance (`PhysicalDisturbance`), N s.
 * - `settings`: the simulation's gravity, floor, rate and substeps.
 * - `body`: the simulated body without its targets, its profile named by
 *   `profileDigest`, the FNV-1a digest of its JSON, which the replay checks
 *   against the subject it rebuilds.
 * - `records`: in time order, pairs of an `advance` record (`reason`: the key
 *   frame, `input`: the controller's input with each segment's state, `output`:
 *   its result, the state after and the actuation it accumulated) and the
 *   `root` record of the same substep (`input`: the root tracker's input,
 *   `output`: the root task it set, the integral after, the wrench records it
 *   pushed and the actuation after). Bodies in a root task are named by their
 *   bone.
 * - `statics`: each segment's constant state, by bone: body-frame `centerOfMass`,
 *   principal `inertia` and `inertiaRotation`, and `dynamic`.
 * - An input's `segments` holds, by bone, 13 numbers: the world centre of mass,
 *   the orientation quaternion, the velocity and the angular velocity. A root
 *   input's `goals` holds, by bone, the same 13 numbers of the goal's pose
 *   position, pose rotation, velocity and angular velocity.
 * - `shared`: values that occur more than once; a top-level input or output value
 *   `{ "@": n }` stands for `shared[n]`.
 *
 * Numbers are JSON's shortest round-trip doubles, so a value read back is the
 * value recorded, bit for bit, except that negative zero reads as zero.
 */
export namespace PhysicalBalanceReplay {
  /** The fixtures' folder, under the repository. */
  export const FOLDER: string =
    "test/src/features/internal/physicalBalanceReplay";

  /** One segment's recorded state. */
  export interface ISegment {
    /** The world centre of mass, metres. */
    center: IAutoMovieVector3;
    /** The world orientation. */
    orientation: IAutoMovieQuaternion;
    /** The body-frame centre of mass, metres. */
    centerOfMass: IAutoMovieVector3;
    /** The principal inertia, kg m^2. */
    inertia: IAutoMovieVector3;
    /** The principal axes' rotation in the body frame. */
    inertiaRotation: IAutoMovieQuaternion;
    /** The centre of mass's velocity, metres per second. */
    velocity: IAutoMovieVector3;
    /** The angular velocity, radians per second. */
    angularVelocity: IAutoMovieVector3;
    /** Whether the solver integrates the body. */
    dynamic: boolean;
  }

  /** One recorded call. */
  export interface IRecord {
    /** Which call: the balance controller's or the root tracker's. */
    kind: "advance" | "root";
    /** Why the frame was kept, for an `advance` record. */
    reason?: string;
    /** The substep's local seconds. */
    seconds: number;
    /** The call's input, as JSON. */
    input: Record<string, any>;
    /** What the call returned and wrote, as JSON. */
    output: Record<string, any>;
  }

  /** One case's fixture, its records' inputs complete. */
  export interface IFixture {
    /** The disturbance case's name. */
    case: string;
    /** The body the case pushes. */
    subject: "human" | "quad";
    /** The case's intended outcome. */
    outcome: string;
    /** The push's horizontal axis. */
    axis: "x" | "z";
    /** The push's impulse, N s. */
    impulse: number;
    /** The simulation's gravity, floor, rate and substeps. */
    settings: Record<string, any>;
    /** The simulated body without its profile, which its digest names. */
    body: Record<string, any> & { id: string; profileDigest: string };
    /** The kept calls, in time order. */
    records: IRecord[];
  }

  /** A segment's constant state. */
  export interface IStatic {
    /** The body-frame centre of mass, metres. */
    centerOfMass: IAutoMovieVector3;
    /** The principal inertia, kg m^2. */
    inertia: IAutoMovieVector3;
    /** The principal axes' rotation in the body frame. */
    inertiaRotation: IAutoMovieQuaternion;
    /** Whether the solver integrates the body. */
    dynamic: boolean;
  }

  /** One case's file: the fixture with its segments and goals packed. */
  export interface IFile extends IFixture {
    /** Each segment's constant state, by bone. */
    statics: Record<string, IStatic>;
    /** The values the records refer to as `{ "@": n }`. */
    shared: unknown[];
  }

  /** Every fixture's file name. */
  export function list(): string[] {
    return fs
      .readdirSync(path.join(repositoryRoot(), FOLDER))
      .filter((name: string): boolean => name.endsWith(".json"))
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  }

  /** One fixture, read and unpacked. */
  export function load(name: string): IFixture {
    const file: IFile = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot(), FOLDER, name), "utf8"),
    ) as IFile;
    const resolve = (value: unknown): any =>
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 1 &&
      "@" in value
        ? file.shared[(value as { "@": number })["@"]]
        : value;
    const vector = (a: number[], i: number): IAutoMovieVector3 => ({
      x: a[i]!,
      y: a[i + 1]!,
      z: a[i + 2]!,
    });
    const quaternion = (a: number[], i: number): IAutoMovieQuaternion => ({
      x: a[i]!,
      y: a[i + 1]!,
      z: a[i + 2]!,
      w: a[i + 3]!,
    });
    const segment = (bone: string, a: number[]): ISegment => ({
      center: vector(a, 0),
      orientation: quaternion(a, 3),
      centerOfMass: { ...file.statics[bone]!.centerOfMass },
      inertia: { ...file.statics[bone]!.inertia },
      inertiaRotation: { ...file.statics[bone]!.inertiaRotation },
      velocity: vector(a, 7),
      angularVelocity: vector(a, 10),
      dynamic: file.statics[bone]!.dynamic,
    });
    const goal = (a: unknown): unknown =>
      Array.isArray(a)
        ? {
            pose: { position: vector(a, 0), rotation: quaternion(a, 3) },
            velocity: vector(a, 7),
            angularVelocity: vector(a, 10),
          }
        : a;
    const unpack = (
      packed: Record<string, unknown>,
      unpacker: (bone: string, value: any) => unknown,
    ): Record<string, any> =>
      Object.fromEntries(
        Object.entries(packed).map(([bone, value]: [string, unknown]) => [
          bone,
          unpacker(bone, value),
        ]),
      );
    const { statics: _statics, shared: _shared, ...fixture } = file;
    return {
      ...fixture,
      records: file.records.map((record: IRecord): IRecord => {
        const input: Record<string, any> = Object.fromEntries(
          Object.entries(record.input).map(([key, value]) => [
            key,
            resolve(value),
          ]),
        );
        input.segments = unpack(input.segments, segment);
        if (record.kind === "root" && input.goals !== undefined)
          input.goals = unpack(input.goals, (_bone, value) => goal(value));
        return {
          ...record,
          input,
          output: Object.fromEntries(
            Object.entries(record.output).map(([key, value]) => [
              key,
              resolve(value),
            ]),
          ),
        };
      }),
    };
  }

  /** The case's profile, rebuilt as the recording built it. */
  export function profile(
    subject: IFixture["subject"],
  ): IAutoMoviePhysicalProfile {
    return (
      subject === "human"
        ? PhysicalDisturbance.standing(motionHumanBody("m-average"))
        : PhysicalDisturbance.planted(PhysicalModelFixtures.quadrupod())
    ).profile;
  }

  /** FNV-1a over a string, as hex. */
  export function digest(text: string): string {
    let h: number = 0x811c9dc5;
    for (let i: number = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  /**
   * A recorded segment rebuilt with every method the controller reads, each
   * computed as `AutoMovieXpbdBody` computes it.
   */
  export class Body {
    /** The body-frame centre of mass, metres. */
    public readonly centerOfMass: IAutoMovieVector3;
    /** The principal inertia, kg m^2. */
    public readonly inertia: IAutoMovieVector3;
    /** The principal axes' rotation in the body frame. */
    public readonly inertiaRotation: IAutoMovieQuaternion;
    private readonly center: IAutoMovieVector3;
    private readonly orientation: IAutoMovieQuaternion;
    private readonly velocity: IAutoMovieVector3;
    private readonly angularVelocity: IAutoMovieVector3;
    private readonly dynamic: boolean;

    public constructor(state: ISegment) {
      this.center = { ...state.center };
      this.orientation = { ...state.orientation };
      this.centerOfMass = { ...state.centerOfMass };
      this.inertia = { ...state.inertia };
      this.inertiaRotation = { ...state.inertiaRotation };
      this.velocity = { ...state.velocity };
      this.angularVelocity = { ...state.angularVelocity };
      this.dynamic = state.dynamic;
    }

    /** The bone origin, world metres. */
    public translation(): IAutoMovieVector3 {
      return Vector3.subtract(
        this.center,
        Quaternion.rotateVector(this.orientation, this.centerOfMass),
      );
    }

    /** The world orientation. */
    public rotation(): IAutoMovieQuaternion {
      return { ...this.orientation };
    }

    /** The world centre of mass, metres. */
    public worldCom(): IAutoMovieVector3 {
      return { ...this.center };
    }

    /** The centre of mass's velocity, metres per second. */
    public linvel(): IAutoMovieVector3 {
      return { ...this.velocity };
    }

    /** The angular velocity, radians per second. */
    public angvel(): IAutoMovieVector3 {
      return { ...this.angularVelocity };
    }

    /** Whether the solver integrates the body. */
    public isDynamic(): boolean {
      return this.dynamic;
    }

    /** A world point's velocity on the body, metres per second. */
    public velocityAtPoint(point: IAutoMovieVector3): IAutoMovieVector3 {
      return Vector3.add(
        this.velocity,
        Vector3.cross(
          this.angularVelocity,
          Vector3.subtract(point, this.center),
        ),
      );
    }

    /**
     * The world inverse inertia applied to a world vector; zero when not
     * dynamic.
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

    /** The world inertia applied to a world vector. */
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
  }

  /** The recorded segments as bodies, by bone. */
  export function segments(
    recorded: Record<string, ISegment>,
  ): Map<string, Body> {
    return new Map(
      Object.entries(recorded).map(([bone, state]: [string, ISegment]) => [
        bone,
        new Body(state),
      ]),
    );
  }

  const clone = <T>(value: T): T =>
    value === undefined ? value : structuredClone(value);
  const entries = (
    map: Map<string, IAutoMovieVector3> | undefined,
  ): [string, IAutoMovieVector3][] | undefined =>
    map ? [...map].map(([k, v]) => [k, { ...v }]) : undefined;

  /** Replay one `advance` record: what the controller returns and writes. */
  export function advance(
    fixture: IFixture,
    record: IRecord,
    built: IAutoMoviePhysicalProfile,
  ): Record<string, any> {
    const input = record.input;
    const state: IAutoMoviePhysicalRecoveryState = clone(input.state) ?? {
      last: "supported",
      steps: [],
      offsets: Object.create(null),
    };
    const actuation: Map<string, IAutoMovieVector3> | undefined =
      input.actuation
        ? new Map(clone(input.actuation) as [string, IAutoMovieVector3][])
        : undefined;
    const output = advancePhysicalBalance({
      world: undefined as never,
      body: fixture.body.id,
      profile: built,
      segments: segments(input.segments) as never,
      colliders: new Map(),
      contacts: [],
      policy: clone(fixture.body.balance) as IAutoMoviePhysicalRecoveryPolicy,
      state,
      targets: clone(input.targets) as Record<string, IAutoMovieRigidTransform>,
      ...(input.velocities ? { velocities: clone(input.velocities) } : {}),
      ...(input.unavailable ? { unavailable: clone(input.unavailable) } : {}),
      seconds: input.seconds,
      dt: input.dt,
      gravity: input.gravity,
      floor: input.floor,
      ...(actuation ? { actuation } : {}),
      supports: clone(
        input.supports,
      ) as IAutoMovieCollectPhysicalSupports.ISupport[],
    });
    return {
      rootStrength: output.rootStrength,
      ...(output.rootShift ? { rootShift: clone(output.rootShift) } : {}),
      goals: clone(output.goals),
      ...(output.swing ? { swing: clone(output.swing) } : {}),
      state: clone(state),
      actuation: entries(actuation),
    };
  }

  /**
   * One `advance` record's readings and state as the controller's phases see
   * them: the readings built from the recorded bodies and supports, and the
   * recorded state before the call, a copy.
   */
  export function sense(
    fixture: IFixture,
    record: IRecord,
    built: IAutoMoviePhysicalProfile,
  ): {
    sense: physicalBalanceSense.ISense;
    state: IAutoMoviePhysicalRecoveryState;
  } {
    const input = record.input;
    return {
      sense: physicalBalanceSense({
        profile: built,
        segments: segments(input.segments) as never,
        policy: clone(fixture.body.balance) as IAutoMoviePhysicalRecoveryPolicy,
        targets: clone(input.targets) as Record<
          string,
          IAutoMovieRigidTransform
        >,
        ...(input.velocities ? { velocities: clone(input.velocities) } : {}),
        ...(input.unavailable ? { unavailable: clone(input.unavailable) } : {}),
        seconds: input.seconds,
        dt: input.dt,
        gravity: input.gravity,
        floor: input.floor,
        supports: clone(
          input.supports,
        ) as IAutoMovieCollectPhysicalSupports.ISupport[],
      }),
      state: clone(input.state) ?? {
        last: "supported",
        steps: [],
        offsets: Object.create(null),
      },
    };
  }

  /** Replay one `root` record: the task, integral, wrenches and actuation. */
  export function root(
    fixture: IFixture,
    record: IRecord,
    built: IAutoMoviePhysicalProfile,
  ): Record<string, any> {
    const input = record.input;
    const bodies: Map<string, Body> = segments(input.segments);
    const names: Map<unknown, string> = new Map(
      [...bodies].map(([bone, body]: [string, Body]) => [body, bone]),
    );
    const rootBone: string = built.segments.find(
      (segment): boolean =>
        !built.joints.some((joint): boolean => joint.child === segment.bone),
    )!.bone;
    const world = { rootTasks: new Map<unknown, any>() };
    const bound = {
      segments: new Map([[fixture.body.id, bodies]]),
      order: new Map([[fixture.body.id, [{ bone: rootBone }]]]),
      supportWrenches: [] as unknown[],
    };
    const integral = clone(input.integral);
    const actuation: Map<string, IAutoMovieVector3> | undefined =
      input.actuation
        ? new Map(clone(input.actuation) as [string, IAutoMovieVector3][])
        : undefined;
    const base: Body = bodies.get(input.base)!;
    trackPhysicalRoot({
      settings: clone(
        fixture.settings,
      ) as IAutoMoviePhysicalSimulationInput.IInput,
      body: {
        ...clone(fixture.body),
        profile: built,
      } as unknown as IAutoMoviePhysicalSimulationInput.IBody,
      bound: bound as never,
      base: base as never,
      rootDynamic: input.rootDynamic,
      rootIntent: clone(
        input.rootIntent,
      ) as IAutoMovieSamplePhysicalTarget.IResult,
      target: clone(input.target) as IAutoMoviePhysicalSimulationInput.ITarget,
      ...(input.rootShift ? { rootShift: clone(input.rootShift) } : {}),
      ...(input.planted ? { planted: clone(input.planted) } : {}),
      ...(input.seating ? { seating: clone(input.seating) } : {}),
      ...(input.center ? { center: clone(input.center) } : {}),
      ...(input.landed !== undefined ? { landed: input.landed } : {}),
      ...(integral ? { integral } : {}),
      // A two-support body runs IHMC's capture-point controller, as the world
      // gives it one (`trackPhysicalWorld`); a recording without its state
      // starts it new.
      ...((
        fixture.body.supportTracking?.pattern ?? fixture.body.balance?.pattern
      )?.limbs.length === 2
        ? {
            icp: clone(input.icp) ?? {
              ...physicalIcpController.create(),
              key: "",
            },
            ...(input.desired ? { desired: clone(input.desired) } : {}),
          }
        : {}),
      ...(input.pushed !== undefined ? { pushed: input.pushed } : {}),
      gravity: clone(input.gravity),
      ...(actuation ? { actuation } : {}),
      supports: clone(
        input.supports,
      ) as IAutoMovieCollectPhysicalSupports.ISupport[],
      ...(input.recoveryBones
        ? { recoveryBones: clone(input.recoveryBones) }
        : {}),
      ...(input.requested ? { requested: clone(input.requested) } : {}),
      step: input.step,
      seconds: input.seconds,
      dt: input.dt,
      world: world as never,
      goals: clone(input.goals),
    } as trackPhysicalRoot.IInput);
    const task = world.rootTasks.get(base);
    const named = (
      list: Iterable<unknown> | undefined,
    ): string[] | undefined =>
      list
        ? [...list].map((body: unknown): string => names.get(body) ?? "?")
        : undefined;
    return {
      task: task
        ? {
            origin: clone(task.origin),
            force: clone(task.force),
            torque: clone(task.torque),
            ...(task.spin ? { spin: clone(task.spin) } : {}),
            ...(task.bounds
              ? {
                  bounds: task.bounds.map(
                    (b: { bodies: unknown[]; force: number }) => ({
                      bodies: named(b.bodies),
                      force: b.force,
                    }),
                  ),
                }
              : {}),
            ...(task.released ? { released: named(task.released) } : {}),
            ...(task.stance ? { stance: named(task.stance) } : {}),
          }
        : null,
      integral: clone(integral),
      supportWrenches: clone(bound.supportWrenches),
      actuation: entries(actuation),
    };
  }
}
