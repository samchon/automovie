import { AutoMovieEngineXpbdBody, AutoMovieEngineXpbdWorld, AutoMovieEnginePhysicalIcpController, AutoMovieEnginePhysicalRootTracking, AutoMovieEnginePhysicalBalance, type AutoMovieEnginePhysicalBalanceTypes } from "@automovie/engine";
import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

import { PhysicalDisturbance } from "./PhysicalDisturbance";
import { PhysicalHumanProfiles } from "./PhysicalHumanProfiles";
import { PhysicalModelFixtures } from "./PhysicalModelFixtures";
import { motionHumanBody } from "./motionHumanBody";
import { repositoryRoot } from "./repositoryRoot";

/**
 * The balance controller's recorded calls and their golden outputs, replayed
 * without a simulation: each fixture holds one disturbance case's key frames,
 * the complete inputs of `AutoMovieEnginePhysicalBalance.advance` and `AutoMovieEnginePhysicalRootTracking` at
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
 * - `profile`, optional: that profile itself, which `stored` reads and checks
 *   against the digest, so a replay builds no figure.
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

  /** A recorded `advance` call's input, its segments unpacked. */
  export type IAdvanceInput = Pick<
    Parameters<typeof AutoMovieEnginePhysicalBalance.advance>[0],
    | "targets"
    | "velocities"
    | "unavailable"
    | "seconds"
    | "dt"
    | "gravity"
    | "floor"
  > & {
    /** The supports' measured contacts. */
    supports: IAutoMovieCollectPhysicalSupports.ISupport[];
    /** The state before the call; absent before the first. */
    state?: IAutoMoviePhysicalRecoveryState;
    /** Each segment's recorded state, by bone. */
    segments: Record<string, ISegment>;
    /** The accumulated actuation before the call, by bone. */
    actuation?: [string, IAutoMovieVector3][];
  };

  /** A recorded `root` call's input, its segments and goals unpacked. */
  export type IRootInput = Pick<
    AutoMovieEnginePhysicalRootTracking.IInput,
    | "rootDynamic"
    | "rootIntent"
    | "target"
    | "rootShift"
    | "planted"
    | "seating"
    | "center"
    | "landed"
    | "integral"
    | "icp"
    | "desired"
    | "omega"
    | "pushed"
    | "gravity"
    | "supports"
    | "recoveryBones"
    | "requested"
    | "step"
    | "seconds"
    | "dt"
    | "goals"
  > & {
    /** The root segment's bone. */
    base: string;
    /** Each segment's recorded state, by bone. */
    segments: Record<string, ISegment>;
    /** The accumulated actuation before the call, by bone. */
    actuation?: [string, IAutoMovieVector3][];
  };

  /**
   * What a replayed root record's call set and wrote: the root task with its
   * bodies named by bone, the integral after, the wrench records and the
   * actuation after.
   */
  export type IRootReplay = {
    /** Root wrench task after the call, with participating bodies named by bone. */
    task: {
      origin: IAutoMovieVector3;
      force: IAutoMovieVector3;
      torque: IAutoMovieVector3;
      spin?: IAutoMovieVector3;
      bounds?: { bodies: string[] | undefined; force: number }[];
      released?: string[] | undefined;
      stance?: string[] | undefined;
      objective?: {
        force: IAutoMovieVector3;
        yaw?: AutoMovieEngineXpbdWorld.IObjective["yaw"];
        pressure?: {
          point: IAutoMovieVector3;
          weight: number;
          bodies?: string[] | undefined;
        };
      };
    } | null;

    /** The root controller's integral state after the call. */
    integral: IRootInput["integral"];

    /** The support wrenches written by the call, in recording order. */
    supportWrenches: AutoMovieEnginePhysicalRootTracking.IInput["bound"]["supportWrenches"];

    /** The accumulated actuation by bone, when recording was enabled. */
    actuation: [string, IAutoMovieVector3][] | undefined;
  };

  /** One recorded call: the balance controller's or the root tracker's. */
  export type IRecord = IAdvanceRecord | IRootRecord;

  /** One recorded balance controller call. */
  export interface IAdvanceRecord {
    /** The balance controller's call. */
    kind: "advance";
    /** Why the frame was kept. */
    reason?: string;
    /** The substep's local seconds. */
    seconds: number;
    /** The call's input. */
    input: IAdvanceInput;
    /** What the call returned and wrote, as JSON. */
    output: Record<string, unknown>;
  }

  /** One recorded root tracker call. */
  export interface IRootRecord {
    /** The root tracker's call. */
    kind: "root";
    /** Unused for a root record. */
    reason?: string;
    /** The substep's local seconds. */
    seconds: number;
    /** The call's input. */
    input: IRootInput;
    /** What the call wrote, as JSON. */
    output: Record<string, unknown>;
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
    settings: AutoMovieEnginePhysicalRootTracking.IInput["settings"];
    /** The simulated body without its profile, which its digest names. */
    body: Omit<IAutoMoviePhysicalSimulationInput.IBody, "profile"> & {
      profileDigest: string;
    };
    /**
     * The profile the digest names, when the fixture stores it, so a replay
     * needs no figure built (`stored`).
     */
    profile?: IAutoMoviePhysicalProfile;
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
  export interface IFile extends Omit<IFixture, "records"> {
    /** The kept calls, packed. */
    records: object[];
    /** Each segment's constant state, by bone. */
    statics: Record<string, IStatic>;
    /** The values the records refer to as `{ "@": n }`. */
    shared: unknown[];
  }

  /**
   * The fixtures whose key frames the replay checks: each subject's recovery,
   * which steps and lands, and its fall, which fails; the sustained and extra
   * pushes pass through the same phases at the same kinds of frame.
   */
  export const KEY_FIXTURES: readonly string[] = [
    // The Human's recovery first: it stores the profile the fall reuses.
    "human_recover_z.json",
    "human_fall_z.json",
    "quad_recover_z.json",
    "quad_fall_z.json",
  ];

  /**
   * A fixture's key records, by index: the controller's call at quiet stance,
   * at the push, at the first and last events, mid-swing and at the landing
   * ramp's end or after the landing, each phase's frame once; and the root
   * tracker's at quiet stance and mid-swing, or at the push without a swing.
   */
  export function keyFrames(fixture: IFixture): number[] {
    const records: IRecord[] = fixture.records;
    const advance = (reason: string): number | undefined => {
      const index: number = records.findIndex(
        (record: IRecord): boolean =>
          record.kind === "advance" && record.reason === reason,
      );
      return index < 0 ? undefined : index;
    };
    const events: number[] = records.flatMap(
      (record: IRecord, index: number): number[] =>
        record.kind === "advance" && record.reason === "event" ? [index] : [],
    );
    const picked: Set<number> = new Set();
    for (const index of [
      advance("fixed 0.1"),
      advance("fixed 0.21"),
      events[0],
      advance("mid-swing"),
      advance("ramp end") ?? advance("post-landing"),
      events.at(-1),
    ])
      if (index !== undefined) picked.add(index);
    for (const index of [
      advance("fixed 0.1"),
      advance("mid-swing") ?? advance("fixed 0.21"),
    ])
      if (index !== undefined && records[index + 1]?.kind === "root")
        picked.add(index + 1);
    return [...picked].sort((a: number, b: number): number => a - b);
  }

  /** The fixture that stores the canonical Human's profile (`stored`). */
  export const HUMAN_PROFILE: string = "human_recover_z.json";

  /** Every fixture's file name. */
  export async function list(): Promise<string[]> {
    return (await fs.readdir(path.join(repositoryRoot(), FOLDER)))
      .filter((name: string): boolean => name.endsWith(".json"))
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  }

  /** One fixture, read and unpacked. */
  export async function load(name: string): Promise<IFixture> {
    const text: string = await fs.readFile(
      path.join(repositoryRoot(), FOLDER, name),
      "utf8",
    );
    // The constant states and the shared values first; the second reading
    // unpacks each record's input and output with them.
    const { statics, shared }: Pick<IFile, "statics" | "shared"> =
      JSON.parse(text);
    const resolve = (value: unknown): unknown =>
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 1 &&
      "@" in value &&
      typeof value["@"] === "number"
        ? shared[value["@"]]
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
      centerOfMass: { ...statics[bone]!.centerOfMass },
      inertia: { ...statics[bone]!.inertia },
      inertiaRotation: { ...statics[bone]!.inertiaRotation },
      velocity: vector(a, 7),
      angularVelocity: vector(a, 10),
      dynamic: statics[bone]!.dynamic,
    });
    const goal = (a: number[]): IAutoMovieSamplePhysicalTarget.IResult => ({
      pose: { position: vector(a, 0), rotation: quaternion(a, 3) },
      velocity: vector(a, 7),
      angularVelocity: vector(a, 10),
    });
    const unpack = <T>(
      packed: Record<string, number[]>,
      unpacker: (bone: string, value: number[]) => T,
    ): Record<string, T> =>
      Object.fromEntries(
        Object.entries(packed).map(([bone, value]: [string, number[]]) => [
          bone,
          unpacker(bone, value),
        ]),
      );
    // The JSON reading is the fixture's typed boundary: a record's input and
    // output values resolve their shared references, and an input's segments
    // and a root input's goals unpack into their states.
    const parsed: IFixture & Pick<IFile, "statics" | "shared"> = JSON.parse(
      text,
      function (this: object, key: string, value) {
        if ((key !== "input" && key !== "output") || !("kind" in this))
          return value;
        for (const entry of Object.keys(value))
          value[entry] = resolve(value[entry]);
        if (key === "input") {
          value.segments = unpack(value.segments, segment);
          if (this.kind === "root" && value.goals !== undefined)
            value.goals = unpack(value.goals, (_bone: string, a: number[]) =>
              goal(a),
            );
        }
        return value;
      },
    );
    const { statics: _statics, shared: _shared, ...fixture } = parsed;
    return fixture;
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

  /**
   * The case's profile as the fixture stores it, checked against the digest the
   * recording took of it; rebuilt as the recording built it when the fixture
   * stores none.
   */
  export async function stored(
    fixture: IFixture,
  ): Promise<IAutoMoviePhysicalProfile> {
    if (fixture.profile === undefined)
      return fixture.subject === "human"
        ? stored({
            ...fixture,
            profile: await PhysicalHumanProfiles.load("m-average"),
          })
        : PhysicalModelFixtures.quadrupod();
    const found: string = digest(JSON.stringify(fixture.profile));
    if (found !== fixture.body.profileDigest)
      throw new Error(
        `${fixture.case}: the stored profile's digest is ${found}, recorded ${fixture.body.profileDigest}`,
      );
    return fixture.profile;
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
   * A recorded segment as a solver body: its centre, orientation, mass frame
   * and velocities written as recorded, bit for bit. The recording keeps no
   * mass, which the controller does not read.
   */
  export function body(state: ISegment, handle: number): AutoMovieEngineXpbdBody {
    const result: AutoMovieEngineXpbdBody = new AutoMovieEngineXpbdBody(
      handle,
      state.dynamic,
      state.center,
      state.orientation,
    );
    result.center = { ...state.center };
    result.orientation = { ...state.orientation };
    result.centerOfMass = { ...state.centerOfMass };
    result.inertia = { ...state.inertia };
    result.inertiaRotation = { ...state.inertiaRotation };
    result.velocity = { ...state.velocity };
    result.angularVelocity = { ...state.angularVelocity };
    return result;
  }

  /** The recorded segments as bodies, by bone. */
  export function segments(
    recorded: Record<string, ISegment>,
  ): Map<string, AutoMovieEngineXpbdBody> {
    return new Map(
      Object.entries(recorded).map(
        ([bone, state]: [string, ISegment], handle: number) => [
          bone,
          body(state, handle),
        ],
      ),
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
    record: IAdvanceRecord,
    built: IAutoMoviePhysicalProfile,
  ): Record<string, unknown> {
    const input: IAdvanceInput = record.input;
    const state: IAutoMoviePhysicalRecoveryState = clone(input.state) ?? {
      last: "supported",
      steps: [],
      offsets: Object.create(null),
    };
    const actuation: Map<string, IAutoMovieVector3> | undefined =
      input.actuation ? new Map(clone(input.actuation)) : undefined;
    const output = AutoMovieEnginePhysicalBalance.advance({
      // The controller reads no solver state but the recorded segments.
      world: new AutoMovieEngineXpbdWorld(fixture.settings.gravity),
      body: fixture.body.id,
      profile: built,
      segments: segments(input.segments),
      colliders: new Map(),
      contacts: [],
      policy: clone(fixture.body.balance)!,
      state,
      targets: clone(input.targets),
      ...(input.velocities ? { velocities: clone(input.velocities) } : {}),
      ...(input.unavailable ? { unavailable: clone(input.unavailable) } : {}),
      seconds: input.seconds,
      dt: input.dt,
      gravity: input.gravity,
      floor: input.floor,
      ...(actuation ? { actuation } : {}),
      supports: clone(input.supports),
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
    record: IAdvanceRecord,
    built: IAutoMoviePhysicalProfile,
  ): {
    sense: AutoMovieEnginePhysicalBalanceTypes.ISense;
    state: IAutoMoviePhysicalRecoveryState;
  } {
    const input: IAdvanceInput = record.input;
    return {
      sense: AutoMovieEnginePhysicalBalance.sense({
        profile: built,
        segments: segments(input.segments),
        policy: clone(fixture.body.balance)!,
        targets: clone(input.targets),
        ...(input.velocities ? { velocities: clone(input.velocities) } : {}),
        ...(input.unavailable ? { unavailable: clone(input.unavailable) } : {}),
        seconds: input.seconds,
        dt: input.dt,
        gravity: input.gravity,
        floor: input.floor,
        supports: clone(input.supports),
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
    record: IRootRecord,
    built: IAutoMoviePhysicalProfile,
  ): IRootReplay {
    const input: IRootInput = record.input;
    const bodies: Map<string, AutoMovieEngineXpbdBody> = segments(input.segments);
    const names: Map<AutoMovieEngineXpbdBody, string> = new Map(
      [...bodies].map(([bone, body]: [string, AutoMovieEngineXpbdBody]) => [
        body,
        bone,
      ]),
    );
    const rootSegment: IAutoMoviePhysicalSegment = built.segments.find(
      (segment): boolean =>
        !built.joints.some((joint): boolean => joint.child === segment.bone),
    )!;
    const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld(
      fixture.settings.gravity,
    );
    const bound: AutoMovieEnginePhysicalRootTracking.IInput["bound"] = {
      segments: new Map([[fixture.body.id, bodies]]),
      order: new Map([[fixture.body.id, [rootSegment]]]),
      supportWrenches: [],
    };
    const integral = clone(input.integral);
    const actuation: Map<string, IAutoMovieVector3> | undefined =
      input.actuation ? new Map(clone(input.actuation)) : undefined;
    const base: AutoMovieEngineXpbdBody = bodies.get(input.base)!;
    AutoMovieEnginePhysicalRootTracking.track({
      settings: clone(fixture.settings),
      body: { ...clone(fixture.body), profile: built },
      bound,
      base,
      rootDynamic: input.rootDynamic,
      rootIntent: clone(input.rootIntent),
      target: clone(input.target),
      ...(input.rootShift ? { rootShift: clone(input.rootShift) } : {}),
      ...(input.planted ? { planted: clone(input.planted) } : {}),
      ...(input.seating ? { seating: clone(input.seating) } : {}),
      ...(input.center ? { center: clone(input.center) } : {}),
      ...(input.landed !== undefined ? { landed: input.landed } : {}),
      ...(integral ? { integral } : {}),
      // Every balancing body, whatever its contacts, runs IHMC's capture-point
      // controller on their hull, as the world gives it (`trackPhysicalWorld`);
      // a recording without its state starts it new.
      icp: clone(input.icp) ?? {
        ...AutoMovieEnginePhysicalIcpController.create(),
        key: "",
      },
      ...(input.desired ? { desired: clone(input.desired) } : {}),
      ...(input.omega !== undefined ? { omega: input.omega } : {}),
      ...(input.pushed !== undefined ? { pushed: input.pushed } : {}),
      gravity: clone(input.gravity),
      ...(actuation ? { actuation } : {}),
      supports: clone(input.supports),
      ...(input.recoveryBones
        ? { recoveryBones: clone(input.recoveryBones) }
        : {}),
      ...(input.requested ? { requested: clone(input.requested) } : {}),
      step: input.step,
      seconds: input.seconds,
      dt: input.dt,
      world,
      goals: clone(input.goals),
    });
    const task: AutoMovieEngineXpbdWorld.IRootTask | undefined =
      world.rootTasks.get(base);
    const named = (
      list: Iterable<AutoMovieEngineXpbdBody> | undefined,
    ): string[] | undefined =>
      list
        ? [...list].map(
            (body: AutoMovieEngineXpbdBody): string => names.get(body) ?? "?",
          )
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
                  bounds: task.bounds.map((b: AutoMovieEngineXpbdWorld.IBound) => ({
                    bodies: named(b.bodies),
                    force: b.force,
                  })),
                }
              : {}),
            ...(task.released ? { released: named(task.released) } : {}),
            ...(task.stance ? { stance: named(task.stance) } : {}),
            ...(task.objective
              ? {
                  objective: {
                    force: clone(task.objective.force),
                    ...(task.objective.yaw
                      ? { yaw: clone(task.objective.yaw) }
                      : {}),
                    ...(task.objective.pressure
                      ? {
                          pressure: {
                            point: clone(task.objective.pressure.point),
                            weight: task.objective.pressure.weight,
                            ...(task.objective.pressure.bodies
                              ? {
                                  bodies: named(task.objective.pressure.bodies),
                                }
                              : {}),
                          },
                        }
                      : {}),
                  },
                }
              : {}),
          }
        : null,
      integral: clone(integral),
      supportWrenches: clone(bound.supportWrenches),
      actuation: entries(actuation),
    };
  }
}
