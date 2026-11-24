import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";
import { PhysicalSupportLoads } from "../internal/PhysicalSupportLoads";

/** The quiet stance's recording: the four-support primitive standing unpushed. */
const QUIET: string = "quad_p0_z.json";

/**
 * How far the supports' load may stand from the body's weight, as a share of
 * it.
 */
const LOAD: number = 0.02;

/** How far the mass center may move over `WINDOW`, metres. */
const DRIFT: number = 0.002;

/**
 * The window over which a quiet stance holds its mass center within `DRIFT`,
 * seconds.
 */
const WINDOW: number = 0.15;

/**
 * The shift of the body toward its front supports, metres: wide enough that
 * moment balance leaves the front pair more than half the load however each box
 * spreads its own.
 */
const SHIFT: number = 0.25;

/**
 * The four-support primitive's root tracker asks its supports, at quiet stance,
 * for its weight where its mass center puts it.
 *
 * At the last quiet frame of the unpushed recording (`quad_p0_z`), read one
 * substep later, under the same internal actuation as the Human, the root
 * tracker is replayed (`PhysicalBalanceReplay.root`, which calls
 * `trackPhysicalRoot`) and its support task read: the force the supports are
 * asked for and the centre of pressure it commands of them.
 *
 * Scenarios:
 *
 * 1. The supports are asked for the body's weight.
 * 2. The mass center is asked to hold still: the task's horizontal force is below
 *    what would move it `DRIFT` within `WINDOW` from rest.
 * 3. The commanded centre of pressure stands under the mass center: an offset d
 *    drives the linear inverted pendulum at g d / h, so it lies within the
 *    offset that moves the mass center `DRIFT` within `WINDOW`.
 * 4. With every leg's state and goal turned rigidly about its planted support so
 *    the body stands 250 mm toward the front pair, its targets still
 *    articulated, 1 to 3 hold, and moment balance about the commanded centre of
 *    pressure leaves the front pair more than half the load however each 0.24 m
 *    box bears its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the replayed frame, the two stances and what each must show.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `trackPhysicalRoot` through the replay on the recorded and the leaned inputs and reads the root task it sets: its force and its centre-of-pressure command.
 * @evidence contracts/development/testing.md#independent-expectations The weight is the profile's mass times the recorded gravity; the drift bounds are the constant acceleration a t^2 / 2 that moves the mass center `DRIFT` in `WINDOW`, for the force directly and for the centre of pressure through the linear inverted pendulum's g / h; the mass center comes from the recorded segments' centres and the profile's masses, the footprints from the frame's measured support points.
 * @evidence contracts/development/testing.md#distinguishing-cases A centred and a leaned stance: a tracker that left its centre of pressure at the stance's middle or under the root after the lean fails 3 and 4, one that asked less than the weight or pushed the body sideways fails 1 or 2. Whether the quiet stance steps is `test_physical_primitive_quiet_stance`'s; the split the allocator makes of a task is `test_physical_support_wrench`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over one fixture file in the repository; the primitive's profile is built in closed form, and no native world, viewer or simulation runs.
 */
export function test_physical_primitive_quiet_support(): void {
  const fixture: PhysicalBalanceReplay.IFixture =
    PhysicalBalanceReplay.load(QUIET);
  const profile: IAutoMoviePhysicalProfile =
    PhysicalBalanceReplay.stored(fixture);
  let index: number = fixture.records.length - 1;
  while (index >= 0 && fixture.records[index]!.kind !== "root") index--;
  if (index < 0) throw new Error(`${QUIET} holds no root tracker call`);
  // One substep past the recorded cache instant, where the tracker skips its
  // diagnostic split of the task (`trackPhysicalRoot`): the state at rest is
  // the same, the task the same law's.
  const recorded: PhysicalBalanceReplay.IRecord = fixture.records[index]!;
  const record: PhysicalBalanceReplay.IRecord = {
    ...recorded,
    seconds: recorded.seconds + recorded.input.dt,
    input: {
      ...recorded.input,
      seconds: recorded.input.seconds + recorded.input.dt,
    },
  };

  const failures: string[] = [];
  const lean: (bone: string) => IRigid | undefined = leaning(profile, SHIFT);

  // The leaned targets stay articulated: every joint's anchors meet, as a
  // rigid turn about the support pivots keeps them.
  const leaned: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        pose(lean(segment.bone), segment.neutral),
      ],
    ),
  );
  for (const joint of profile.joints) {
    const gap: number = Vector3.length(
      Vector3.subtract(
        anchor(leaned[joint.parent]!, joint.parentFrame.position),
        anchor(leaned[joint.child]!, joint.childFrame.position),
      ),
    );
    if (gap > 1e-9)
      failures.push(`shifted: ${joint.id} target anchors ${gap} m apart`);
  }

  support(fixture, record, profile, "centred", failures);
  const band: [number, number] | undefined = support(
    fixture,
    shift(record, profile, lean),
    profile,
    "shifted",
    failures,
  );
  if (band && !(band[0] > 0.5))
    failures.push(
      `shifted: the commanded centre of pressure leaves the front pair ${JSON.stringify(band)} of the load`,
    );
  TestValidator.equals(
    "four-support quiet support and weight transfer",
    failures,
    [],
  );
}

/** A rigid motion of one segment: a turn about a pivot, then an offset. */
interface IRigid {
  /** The point the segment turns about, world metres. */
  pivot: IAutoMovieVector3;
  /** The turn. */
  turn: IAutoMovieQuaternion;
  /** The offset after the turn, world metres. */
  offset: IAutoMovieVector3;
}

/**
 * Lean every leg about its planted support joint by the same angle about z:
 * each support keeps its place, the root moves by the hip's displacement and
 * the body stands `shift` toward the front pair over them.
 */
function leaning(
  profile: IAutoMoviePhysicalProfile,
  shift: number,
): (bone: string) => IRigid | undefined {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const pivot = (index: string): IAutoMovieVector3 => {
    const support: IAutoMoviePhysicalSegment = profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        segment.bone === `support-${index}`,
    )!;
    return anchor(
      support.neutral,
      profile.joints.find(
        (joint): boolean => joint.child === `support-${index}`,
      )!.childFrame.position,
    );
  };
  const thigh: IAutoMoviePhysicalSegment = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === "upper-0",
  )!;
  const hip: IAutoMovieVector3 = anchor(
    thigh.neutral,
    profile.joints.find((joint): boolean => joint.child === "upper-0")!
      .childFrame.position,
  );
  const length: number = hip.y - pivot("0").y;
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    (-Math.asin(shift / length) * 180) / Math.PI,
  );
  const moved: IAutoMovieVector3 = Vector3.subtract(
    Quaternion.rotateVector(turn, { x: 0, y: length, z: 0 }),
    { x: 0, y: length, z: 0 },
  );
  const root: string = profile.segments[0]!.bone;
  return (bone: string): IRigid | undefined =>
    bone === root
      ? { pivot: zero, turn: Quaternion.identity(), offset: moved }
      : /^(upper|lower)-/.test(bone)
        ? { pivot: pivot(bone.split("-")[1]!), turn, offset: zero }
        : undefined;
}

/** A world point moved with its segment. */
function point(
  rigid: IRigid | undefined,
  at: IAutoMovieVector3,
): IAutoMovieVector3 {
  return rigid
    ? Vector3.add(
        Vector3.add(
          rigid.pivot,
          Quaternion.rotateVector(
            rigid.turn,
            Vector3.subtract(at, rigid.pivot),
          ),
        ),
        rigid.offset,
      )
    : { ...at };
}

/** A world direction turned with its segment. */
function direction(
  rigid: IRigid | undefined,
  at: IAutoMovieVector3,
): IAutoMovieVector3 {
  return rigid ? Quaternion.rotateVector(rigid.turn, at) : { ...at };
}

/** A segment's world pose moved with it. */
function pose(
  rigid: IRigid | undefined,
  at: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  return {
    position: point(rigid, at.position),
    rotation: rigid
      ? Quaternion.multiply(rigid.turn, at.rotation)
      : { ...at.rotation },
  };
}

/** A local point of a pose in the world. */
function anchor(
  at: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(at.position, Quaternion.rotateVector(at.rotation, local));
}

/**
 * A root record with the lean applied to every segment's state, goal and
 * planted pose, the root's intent and the authored mass center: the body leaned
 * over its planted supports, at rest at its leaned target.
 */
function shift(
  record: PhysicalBalanceReplay.IRecord,
  profile: IAutoMoviePhysicalProfile,
  lean: (bone: string) => IRigid | undefined,
): PhysicalBalanceReplay.IRecord {
  const input: Record<string, any> = structuredClone(record.input);
  const segments: Record<string, PhysicalBalanceReplay.ISegment> =
    input.segments;
  const goals: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
    input.goals;
  const planted: Record<string, IAutoMovieRigidTransform> = input.planted;
  for (const segment of profile.segments) {
    const rigid: IRigid | undefined = lean(segment.bone);
    const state: PhysicalBalanceReplay.ISegment = segments[segment.bone]!;
    const moved: IAutoMovieRigidTransform = pose(rigid, {
      position: state.center,
      rotation: state.orientation,
    });
    segments[segment.bone] = {
      ...state,
      center: moved.position,
      orientation: moved.rotation,
      velocity: direction(rigid, state.velocity),
      angularVelocity: direction(rigid, state.angularVelocity),
    };
    const goal: IAutoMovieSamplePhysicalTarget.IResult | undefined =
      goals[segment.bone];
    if (goal)
      goals[segment.bone] = {
        ...goal,
        pose: pose(rigid, goal.pose),
        velocity: direction(rigid, goal.velocity),
        angularVelocity: direction(rigid, goal.angularVelocity),
      };
    if (planted[segment.bone])
      planted[segment.bone] = pose(rigid, planted[segment.bone]!);
  }
  input.rootIntent.pose = pose(
    lean(profile.segments[0]!.bone),
    input.rootIntent.pose,
  );
  // The authored mass center moves as the authored pose, the neutral one,
  // does under the lean.
  const authored = (
    rigid: (bone: string) => IRigid | undefined,
  ): IAutoMovieVector3 =>
    PhysicalSupportLoads.center(
      profile,
      Object.fromEntries(
        profile.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => [
            segment.bone,
            pose(rigid(segment.bone), segment.neutral),
          ],
        ),
      ),
    );
  input.center = Vector3.add(
    input.center,
    Vector3.subtract(
      authored(lean),
      authored((): undefined => undefined),
    ),
  );
  return { ...record, input };
}

/**
 * Replay one root record and check its support task; the front pair's share of
 * the load moment balance about the commanded centre of pressure allows, with
 * each pair's load anywhere across its footprint.
 */
function support(
  fixture: PhysicalBalanceReplay.IFixture,
  record: PhysicalBalanceReplay.IRecord,
  profile: IAutoMoviePhysicalProfile,
  label: string,
  failures: string[],
): [number, number] | undefined {
  const task: ITask | null = PhysicalBalanceReplay.root(
    fixture,
    record,
    profile,
  ).task;
  const pressure: IAutoMovieVector3 | undefined =
    task?.objective?.pressure?.point;
  if (!task || !pressure) {
    failures.push(`${label}: the root tracker commanded no centre of pressure`);
    return undefined;
  }
  const gravity: number = -fixture.settings.gravity.y;
  const weight: number = profile.mass * gravity;
  if (Math.abs(task.force.y - weight) > weight * LOAD)
    failures.push(
      `${label}: the supports are asked ${task.force.y} N against ${weight} N`,
    );

  // A constant acceleration a moves the mass center a t^2 / 2 in t from
  // rest, so DRIFT over WINDOW bounds it by 2 DRIFT / WINDOW^2.
  const most: number = (2 * DRIFT) / (WINDOW * WINDOW);
  if (Math.hypot(task.force.x, task.force.z) > profile.mass * most)
    failures.push(
      `${label}: the mass center is pushed by ${Math.hypot(task.force.x, task.force.z)} N`,
    );

  // The linear inverted pendulum accelerates its mass center by g d / h for
  // a centre of pressure d from under it, h its height over the floor.
  const center: IAutoMovieVector3 = centerOf(profile, record.input.segments);
  const reach: number = (most * (center.y - fixture.settings.floor)) / gravity;
  const offset: number = Math.hypot(
    pressure.x - center.x,
    pressure.z - center.z,
  );
  if (offset > reach)
    failures.push(
      `${label}: the centre of pressure stands ${offset} m from under the mass center, more than ${reach} m`,
    );

  // The supports split into the pairs either side of the stance's middle;
  // each pair bears its load somewhere across its footprint, so the front
  // share moment balance gives lies within the band its four end pairings
  // give.
  const supports: IAutoMovieCollectPhysicalSupports.ISupport[] =
    record.input.supports;
  const middle: number =
    supports.reduce(
      (sum: number, item: IAutoMovieCollectPhysicalSupports.ISupport): number =>
        sum + item.position.x,
      0,
    ) / supports.length;
  const ends = (front: boolean): [number, number] => {
    const xs: number[] = supports
      .filter(
        (item: IAutoMovieCollectPhysicalSupports.ISupport): boolean =>
          item.position.x > middle === front,
      )
      .flatMap((item: IAutoMovieCollectPhysicalSupports.ISupport): number[] =>
        item.samples.map(
          (sample: IAutoMovieCollectPhysicalSupports.IPoint): number =>
            sample.point.x,
        ),
      );
    return [Math.min(...xs), Math.max(...xs)];
  };
  const shares: number[] = ends(true).flatMap((f: number): number[] =>
    ends(false).map((b: number): number => (pressure.x - b) / (f - b)),
  );
  return [Math.min(...shares), Math.max(...shares)];
}

/** The whole body's mass center from the recorded segments' centres. */
function centerOf(
  profile: IAutoMoviePhysicalProfile,
  segments: Readonly<Record<string, PhysicalBalanceReplay.ISegment>>,
): IAutoMovieVector3 {
  return profile.segments.reduce(
    (sum: IAutoMovieVector3, segment: IAutoMoviePhysicalSegment) =>
      Vector3.add(
        sum,
        Vector3.scale(
          segments[segment.bone]!.center,
          segment.mass / profile.mass,
        ),
      ),
    { x: 0, y: 0, z: 0 },
  );
}

/** The replayed root task: its force and its centre-of-pressure command. */
interface ITask {
  /** The force the supports are asked for, newtons. */
  force: IAutoMovieVector3;
  /** The weighted objective, with the commanded centre of pressure. */
  objective?: { pressure?: { point: IAutoMovieVector3 } };
}
