import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  AutoMovieEngineMotionSampling,
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

import { lieDown } from "../../floor/internal/lieDown";
import { HumanRefusal } from "../../law/HumanRefusal";
import { PreparedHumanIntervals } from "../../perform/internal/PreparedHumanIntervals";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { stuntFallPose } from "./stuntFallPose";

/**
 * Kinetic friction of a body sliding on stair treads, dimensionless
 * (provisional).
 */
const TUMBLE: number = 0.3;

/**
 * Kinetic friction of a seat sliding down treads, dimensionless (provisional: a
 * controlled slide).
 */
const SLIDE: number = 0.55;

/**
 * The least speed between contacts, metres per second (provisional: the body
 * keeps going over each nosing).
 */
const CRAWL: number = 0.4;

/** How far past the last nosing the body comes to rest, metres (provisional). */
const RUNOUT: number = 0.5;

/**
 * Seconds the body takes to go down from standing onto the flight (provisional:
 * a backward fall's half second and more).
 */
const FALL: number = 0.6;

/** Seconds the body settles after its last contact (provisional). */
const SETTLE: number = 0.6;

/**
 * Fall down a staircase from the tread the performer stands on: a tumble on the
 * back and the sides, or a controlled slide on the seat. The body rests on each
 * lower tread's nosing in turn, its lowest part on it, sliding along the flight
 * with Coulomb friction (`a = g (sin α - μ cos α)`, `α` the flight's slope),
 * never slower than `CRAWL`; each nosing is a contact of the back, the side or
 * the seat on the stair prop, after the body has gone down onto the tread it
 * stood on over `FALL`. The body comes to rest `RUNOUT` past the last nosing,
 * lying on its back (or sitting, for the slide).
 *
 * @param context The action's context, standing on a tread of the flight.
 * @param p The stair fall.
 * @returns The fall, ending lying or sitting at the flight's foot.
 * @throws {HumanRefusal} If the prop has no steps, or a tumble has fewer than
 *   two treads below the performer.
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
  // The surface points the body rests on: the tread under the hips, each
  // lower nosing, and the floor past the flight.
  const nosing: (tread: ITread) => IAutoMovieVector3 = (
    tread: ITread,
  ): IAutoMovieVector3 =>
    Vector3.add(tread.centre, Vector3.scale(downhill, tread.depth / 2));
  const hips0: IAutoMovieVector3 = entry.get("hips")!.worldPosition;
  const path: IAutoMovieVector3[] = [
    { ...hips0, y: sole },
    ...below.map(nosing),
  ];
  const last: IAutoMovieVector3 = path.at(-1)!;
  path.push({
    ...Vector3.add(last, Vector3.scale(downhill, RUNOUT)),
    y: world.position.y,
  });

  // Contact arrivals: constant acceleration along each stretch.
  const mu: number = p.slide === true ? SLIDE : TUMBLE;
  const g: number = AutoMovieGravity.STANDARD;
  // The body goes down onto the tread it stood on over `FALL`, then slides.
  const times: number[] = [FALL];
  // The body has come down onto the tread; it slides on from rest.
  let speed: number = 0;
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
  // The flight's slope down its nosings, degrees.
  const first: IAutoMovieVector3 = path[1]!;
  const lowest: IAutoMovieVector3 = path.at(-2)!;
  const slope: number =
    (Math.atan2(
      first.y - lowest.y,
      Math.hypot(first.x - lowest.x, first.z - lowest.z),
    ) *
      180) /
    Math.PI;

  // Feet first down the flight, the head uphill.
  const yaw: number = (Math.atan2(downhill.x, downhill.z) * 180) / Math.PI;
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
  // A tumbling body braces with its arms out, the same on its back and its
  // side, so the roll turns the trunk and legs and never whips the arms.
  const braced: IAutoMovieMotionHumanPosture["joints"] = {
    leftUpperArm: [30, 45, 0],
    rightUpperArm: [30, 45, 0],
    leftLowerArm: [30, 0, 0],
    rightLowerArm: [30, 0, 0],
  };
  const lying: IAutoMovieMotionHumanPosture = pose(
    p.slide === true ? lieDown.POSES.sit : lieDown.POSES.supine,
  );
  const resting: IAutoMovieMotionHumanPosture =
    p.slide === true
      ? lying
      : { ...lying, joints: { ...lying.joints, ...braced } };
  const rolled: IAutoMovieMotionHumanPosture = pose(lieDown.POSES.lateralLeft);
  const side: IAutoMovieMotionHumanPosture = {
    ...rolled,
    joints: { ...rolled.joints, ...braced },
  };
  const blend: ReturnType<typeof prepareHumanShapeBlend> =
    prepareHumanShapeBlend(resting.joints, side.joints);
  const restOn: ReturnType<typeof stuntFallPose.prepareRest> =
    stuntFallPose.prepareRest(body);
  const endAt = (i: number): number => times[i + 1]!;
  const surfaceAt: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => {
    const k: number = PreparedHumanIntervals.upperBound(
      times.length - 2,
      endAt,
      t,
    );
    const span: number = times[k + 1]! - times[k]!;
    const w: number =
      span > 0 ? Math.max(0, Math.min(1, (t - times[k]!) / span)) : 1;
    return Vector3.lerp(path[k]!, path[k + 1]!, w);
  };
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    const surface: IAutoMovieVector3 = surfaceAt(Math.min(t, end));
    // A tumble turns from the back onto the side and back once over the
    // flight, slowly enough that no limb swings out and back between two
    // frames; the slide stays seated.
    const turn: number =
      p.slide === true
        ? 0
        : 0.5 -
          0.5 *
            Math.cos(
              2 * Math.PI * Math.max(0, Math.min(1, (t - FALL) / (end - FALL))),
            );
    const into: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, t / FALL));
    // On its back the body lies along the flight, the head uphill, so it is
    // its back that rests on the nosings and not its heels a leg further
    // down; it lies level again over the run to the floor.
    const level: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.max(0, Math.min(1, (t - times.at(-2)!) / (end - times.at(-2)!))),
    );
    const tilt: number = p.slide === true ? 0 : slope * (1 - level);
    const along: IAutoMovieMotionHumanPosture = {
      ...resting,
      pitch: resting.pitch + tilt,
    };
    // The plane of the nosings under the body, tilted down the flight.
    const r: number = (tilt * Math.PI) / 180;
    const normal: IAutoMovieVector3 = {
      x: downhill.x * Math.sin(r),
      y: Math.cos(r),
      z: downhill.z * Math.sin(r),
    };
    // The blend of the back and the side rests its own furthest collider on
    // that plane, so it never dips into the tread between the two.
    const placed: IAutoMovieMotionHumanPosture = restOn(
      stuntFallPose.blend(along, side, turn, blend(turn)),
      surface,
      normal,
    );
    return into >= 1
      ? placed
      : stuntFallPose.blend(context.entry.posture, placed, into);
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
