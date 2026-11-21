import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStuntFall,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lieDown } from "../floor/lieDown";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { stuntFallPose } from "./stuntFallPose";

/** Kinetic friction of a body sliding on stair treads, dimensionless (provisional). */
const TUMBLE: number = 0.3;

/** Kinetic friction of a seat sliding down treads, dimensionless (provisional: a controlled slide). */
const SLIDE: number = 0.55;

/** The speed the fall starts with, metres per second (provisional: a missed step). */
const START: number = 1.2;

/** The least speed between contacts, metres per second (provisional: the body keeps going over each nosing). */
const CRAWL: number = 0.4;

/** How far past the last nosing the body comes to rest, metres (provisional). */
const RUNOUT: number = 0.5;

/** Seconds the body settles after its last contact (provisional). */
const SETTLE: number = 0.6;

/** The hips' height above a nosing while a part rests on it, metres (provisional: the trunk's half depth). */
const RIDE: number = 0.12;

/**
 * Fall down a staircase from the tread the performer stands on: a tumble on
 * the back and the sides, or a controlled slide on the seat. The hips pass
 * over each lower tread's nosing in turn, `RIDE` above it, sliding along the
 * flight with Coulomb friction (`a = g (sin α - μ cos α)`, `α` the flight's
 * slope), never slower than `CRAWL`; each nosing is a contact of the back,
 * the side or the seat on the stair prop. The body comes to rest `RUNOUT`
 * past the last nosing, lying on its back (or sitting, for the slide).
 *
 * @param context The action's context, standing on a tread of the flight.
 * @param p The stair fall.
 * @returns The fall, ending lying or sitting at the flight's foot.
 * @throws {HumanRefusal} If the prop has no steps, or a tumble has fewer than two treads below the performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, the friction law, the contacts, the end and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Each stretch between nosings is solved in closed form under constant acceleration along the flight; contact times are those arrivals, in descending order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the treads, time the contacts, then one posture writer along the hips path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every contact is a tread of the named flight; the friction and speeds are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the treads at plan time; a binary search per sample.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the contact times and points.
 */
export function stuntFallStairs(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStuntFall.IParams>,
  p: IAutoMovieMotionHumanStuntFall.IStairs,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.stairs);
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  const steps: ITread[] = (reader.prop.affordances ?? [])
    .filter((item: IAutoMovieAffordance): boolean => /^step\d+$/.test(item.id))
    .map(
      (item: IAutoMovieAffordance): ITread => ({
        id: item.id,
        centre: Vector3.add(
          world.position,
          Quaternion.rotateVector(world.rotation, item.frame.translation),
        ),
        depth: item.depth ?? 0,
      }),
    )
    .sort((a: ITread, b: ITread): number => a.centre.y - b.centre.y);
  if (steps.length === 0)
    throw refusal(p.stairs, "the prop has no stair steps");

  // The treads below the soles, highest first, and the floor beyond them.
  const entry: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const sole: number = Math.min(
    entry.get("leftToes")!.worldPosition.y,
    entry.get("rightToes")!.worldPosition.y,
  );
  const below: ITread[] = steps
    .filter((tread: ITread): boolean => tread.centre.y < sole - 0.05)
    .reverse();
  if (below.length < (p.slide === true ? 1 : 2))
    throw refusal(
      p.stairs,
      `a ${p.slide === true ? "slide" : "tumble"} needs ${p.slide === true ? "a tread" : "two treads"} below the performer`,
    );
  const downhill: IAutoMovieVector3 = Vector3.normalize({
    x: steps[0]!.centre.x - steps.at(-1)!.centre.x,
    y: 0,
    z: steps[0]!.centre.z - steps.at(-1)!.centre.z,
  });
  const nosing = (tread: ITread): IAutoMovieVector3 =>
    Vector3.add(
      tread.centre,
      Vector3.add(Vector3.scale(downhill, tread.depth / 2), {
        x: 0,
        y: RIDE,
        z: 0,
      }),
    );
  const path: IAutoMovieVector3[] = [
    entry.get("hips")!.worldPosition,
    ...below.map(nosing),
  ];
  const last: IAutoMovieVector3 = path.at(-1)!;
  path.push({
    ...Vector3.add(last, Vector3.scale(downhill, RUNOUT)),
    y: world.position.y + RIDE,
  });

  // Contact arrivals: constant acceleration along each stretch.
  const mu: number = p.slide === true ? SLIDE : TUMBLE;
  const g: number = AutoMovieGravity.STANDARD;
  const times: number[] = [0];
  let speed: number = START;
  for (let i: number = 1; i < path.length; i++) {
    const delta: IAutoMovieVector3 = Vector3.subtract(path[i]!, path[i - 1]!);
    const length: number = Vector3.length(delta);
    const slope: number = Math.atan2(-delta.y, Math.hypot(delta.x, delta.z));
    const accel: number = g * (Math.sin(slope) - mu * Math.cos(slope));
    const reach: number = speed * speed + 2 * accel * length;
    const arrive: number = Math.max(CRAWL, Math.sqrt(Math.max(0, reach)));
    times.push(times.at(-1)! + (2 * length) / (speed + arrive));
    speed = arrive;
  }
  const end: number = times.at(-1)!;
  const duration: number = end + SETTLE;

  const yaw: number = (Math.atan2(-downhill.x, -downhill.z) * 180) / Math.PI;
  const pose = (
    position: IAutoMovieMotionHumanLieDown.IPose,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw,
    pitch: position.pitch,
    roll: position.roll,
    joints: position.joints,
    limbs: {},
  });
  const resting: IAutoMovieMotionHumanPosture = pose(
    p.slide === true ? lieDown.POSES.sit : lieDown.POSES.supine,
  );
  const side: IAutoMovieMotionHumanPosture = pose(lieDown.POSES.lateralLeft);
  const restOffset: IAutoMovieVector3 = stuntFallPose.offset(body, resting);
  const sideOffset: IAutoMovieVector3 = stuntFallPose.offset(body, side);
  const hipsAt = (t: number): IAutoMovieVector3 => {
    let k: number = 0;
    while (k < times.length - 2 && times[k + 1]! <= t) k++;
    const span: number = times[k + 1]! - times[k]!;
    const w: number =
      span > 0 ? Math.max(0, Math.min(1, (t - times[k]!) / span)) : 1;
    return Vector3.lerp(path[k]!, path[k + 1]!, w);
  };
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    const hips: IAutoMovieVector3 = hipsAt(Math.min(t, end));
    // A tumble turns from the back to the side and back over each tread; the
    // slide stays seated.
    const turn: number =
      p.slide === true
        ? 0
        : 0.5 -
          0.5 *
            Math.cos(
              (2 * Math.PI * Math.min(t, end)) /
                Math.max(1e-6, end / Math.max(1, below.length)),
            );
    const into: number = minimumJerk.share(Math.min(1, t / 0.3));
    const placed: IAutoMovieMotionHumanPosture = blendFromEntry(
      stuntFallPose.at(resting, hips, restOffset),
      stuntFallPose.at(side, hips, sideOffset),
      turn,
    );
    return into >= 1
      ? placed
      : blendFromEntry(context.entry.posture, placed, into);
  };

  const part: IAutoMovieMotionHumanContactWindow["part"] =
    p.slide === true ? "seat" : "back";
  const kind: IAutoMovieMotionHumanContactWindow["kind"] =
    p.slide === true ? "seat" : "lie";
  const contacts: IAutoMovieMotionHumanContactWindow[] = below.map(
    (_: ITread, i: number): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind,
      support: { kind: "prop", subject: p.stairs },
      from: Math.max(0, times[i + 1]! - 0.05) / duration,
      to: Math.min(times[i + 2] ?? end, times[i + 1]! + 0.12) / duration,
    }),
  );
  contacts.push({
    part,
    kind,
    support: { kind: "ground" },
    from: end / duration,
    to: 1,
  });
  return {
    duration,
    events: [
      { name: "fall", share: 0 },
      ...below.map((tread: ITread, i: number) => ({
        name: `${tread.id}Contact`,
        share: times[i + 1]! / duration,
      })),
      { name: "rest", share: end / duration },
    ],
    contacts,
    base: { kind: p.slide === true ? "seated" : "lying" },
    posture,
    yields: [],
  };
}

/** A stair tread in world metres. */
interface ITread {
  /** Its affordance id. */
  id: string;

  /** Its top's centre. */
  centre: IAutoMovieVector3;

  /** Its depth along the flight. */
  depth: number;
}

/** Blend one posture toward another by a weight: joints, root and attitude. */
function blendFromEntry(
  from: IAutoMovieMotionHumanPosture,
  to: IAutoMovieMotionHumanPosture,
  w: number,
): IAutoMovieMotionHumanPosture {
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...to.joints };
  for (const bone of Object.keys(
    to.joints,
  ) as (keyof IAutoMovieMotionHumanPosture["joints"])[]) {
    const a: readonly [number, number, number] = from.joints[bone] ?? [0, 0, 0];
    const b: readonly [number, number, number] = to.joints[bone]!;
    joints[bone] = [
      a[0] + (b[0] - a[0]) * w,
      a[1] + (b[1] - a[1]) * w,
      a[2] + (b[2] - a[2]) * w,
    ];
  }
  return {
    ...to,
    root: Vector3.lerp(from.root, to.root, w),
    yaw: from.yaw + wrapDegrees(to.yaw - from.yaw) * w,
    pitch: from.pitch + (to.pitch - from.pitch) * w,
    roll: from.roll + (to.roll - from.roll) * w,
    joints,
  };
}

/** The stair fall's refusal. */
function refusal(value: string, reason: string): HumanRefusal {
  return new HumanRefusal({
    kind: "affordance",
    axis: "stairs",
    value,
    reason,
    fix: "stage the fall at the top of a longer flight, or slide",
  });
}
