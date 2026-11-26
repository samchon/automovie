import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLasso,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanHand } from "../posture/HumanHand";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { humanLassoAdmit } from "./humanLassoAdmit";

/**
 * The swinging wrist's circle overhead, metres, the hand turning mostly at the
 * wrist; the throw's reach-out time, seconds; the dally's radius round the
 * horn, metres, and seconds per turn (provisional stage readings).
 */
const SWING: Readonly<Record<SWINGEntryItem, number>> = {
  radius: 0.15,
  throw: 0.25,
  wrap: 0.08,
  turn: 0.5,
};

/** The farthest a loop is thrown, metres (provisional). */
const REACH: number = 12;

/** The bone whose joint the entry holds the hand at: the right hand. */
const HAND: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
  ["rightHand"],
);

/** The world up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Rope from the saddle (`IAutoMovieMotionHumanLasso`): carried on the saddle,
 * the rider's wrist circles over the right shoulder, one turn per stride of the
 * horse's own stride cue (or per second); the hand takes the turn its arm
 * strains least in, and the held lariat goes where the hand holds it
 * (`StrikingHeld`); at the release the wrist reaches out toward the target and
 * the lariat is launched so its loop's centre flies the projectile that meets
 * the target's contact at the catch; with a dally the hand then circles the
 * horn its turns and holds there. Register `HumanLasso` to use it.
 */
export const HumanLasso: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLasso> =
  {
    name: "lasso",
    interrupts: {},
    plan: planHumanLasso,
  };

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLasso>;
/** The alternatives of `SWINGEntryItem`'s site. */
type SWINGEntryItem = "radius" | "throw" | "wrap" | "turn";

/** Admit the throw, lay the swing and the launch, then sample. */
function planHumanLasso(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/** Admit, lay the circle and the launch, and sample. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanLasso = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["ride", "mounted"] },
      reason: `a rope is swung from the saddle, and the performer is ${entered.kind}`,
      fix: "ride the horse first",
    });
  const flight: number = humanLassoAdmit(params);

  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame(
    support,
    params.on,
    params.frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
    context,
    "right",
    params.lariat,
    { tip: "loop" },
  );

  // The circle, in the carrier contact's frame: level over the entry's own right shoulder joint and out to its side, so the arm never crosses the head; its outermost point as far from the shoulder as the arm reaches at the elbow's flexion, every other point nearer.
  const local: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    entry,
    origin,
    HumanMountedFrame.LOCAL,
  );
  const shoulder: IAutoMovieVector3 = poseBones(
    context.body,
    resolveHumanPosture.seeded(
      context.body,
      { ...local, limbs: {} },
      undefined,
      {},
      undefined,
      HumanBoneGroups.RIGHT_SHOULDER,
    ).pose,
    undefined,
    HumanBoneGroups.RIGHT_SHOULDER,
  ).get("rightUpperArm")!.worldPosition;
  const upper: number = context.body.measure.upperArm;
  const fore: number = context.body.measure.forearm;
  const wristReach: number = humanLassoAdmit.wristReach(upper, fore);

  const heading: IAutoMovieQuaternion = humanPostureHeading(local);
  const forward: IAutoMovieVector3 = Vector3.normalize({
    ...Quaternion.rotateVector(heading, { x: 0, y: 0, z: 1 }),
    y: 0,
  });
  const left: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const centre: IAutoMovieVector3 = Vector3.add(
    Vector3.add(shoulder, Vector3.scale(left, -SWING.radius)),
    {
      x: 0,
      y: Math.sqrt(wristReach * wristReach - 4 * SWING.radius * SWING.radius),
      z: 0,
    },
  );
  const arrival: IAutoMovieVector3 = Vector3.add(
    centre,
    Vector3.scale(forward, SWING.radius),
  );
  // The hand turned so the lariat runs out level along a direction, its edge along the circle's way round; the loop's centre from the wrist under that turn.
  const attitude = (axis: IAutoMovieVector3): IAutoMovieQuaternion =>
    StrikingHeld.hand(tool, 0, centre, axis, Vector3.cross(UP, axis)).rotation;
  const gripToLoop: IAutoMovieVector3 = Vector3.add(
    HumanHand.offset(context.body, "right", "grip").point,
    tool.tip,
  );

  // The swing's clock: the stride's mean period, or a second a turn. The wrist first rises from where the entry holds it to the circle's front, at the swing's own speed under a minimum-jerk profile, slowed by the action's time scale where its course needs more (`HumanPerformanceTempo`), and the swing begins on the first stride instant after it arrives.
  const shown0: IAutoMovieVector3 = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    HAND,
  ).get("rightHand")!.worldPosition;
  const rest: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(origin.rotation),
    Vector3.subtract(shown0, origin.position),
  );
  let period: number = 1;
  let instants: number[] = [0];
  if (params.stride !== undefined) {
    instants = context
      .cue(params.stride)
      .map((c) => c.seconds - context.start)
      .filter((t: number): boolean => t >= 0)
      .sort((a: number, b: number): number => a - b);
    if (instants.length < 2)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stride",
        value: params.stride,
        feasible: null,
        reason:
          "the swing keeps time with a stride track of at least two instants inside the act",
        fix: "cue the horse's stride",
      });
    period =
      (instants[instants.length - 1]! - instants[0]!) / (instants.length - 1);
  }
  const raise: number =
    ((context.tempo ?? 1) *
      minimumJerk.rate(0.5) *
      Vector3.distance(rest, arrival) *
      period) /
    (2 * Math.PI * SWING.radius);
  const phase0: number =
    instants.find((t: number): boolean => t >= raise) ??
    instants[0]! + Math.ceil((raise - instants[0]!) / period) * period;
  const release: number = phase0 + params.swings * period;
  const reach: number = release - SWING.throw;
  const caught: number = release + flight;
  const turns: number = params.dally?.turns ?? 0;
  const duration: number = caught + turns * SWING.turn + 0.5;

  // The throw: from the circle toward where the target's contact will be at the catch, read in the carrier's frame at the release.
  const target = (film: number): IAutoMovieVector3 =>
    HumanMountedFrame.contact(
      context.prop(params.target.subject),
      params.target.contact,
      film,
    );
  const at: IAutoMovieVector3 = target(context.start + caught);
  const released: IAutoMovieRigidTransform = carrier(context.start + release);
  const toward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(
      Quaternion.rotateVector(
        Quaternion.inverse(released.rotation),
        Vector3.subtract(at, released.position),
      ),
      centre,
    ),
  );
  const level: IAutoMovieVector3 = Vector3.normalize({ ...toward, y: 0 });
  const thrown: IAutoMovieVector3 = Vector3.add(
    centre,
    Vector3.scale(toward, SWING.radius),
  );
  const out: IAutoMovieVector3 = Vector3.add(
    released.position,
    Quaternion.rotateVector(
      released.rotation,
      Vector3.add(thrown, Quaternion.rotateVector(attitude(level), gripToLoop)),
    ),
  );
  const distance: number = Vector3.distance(out, at);
  if (distance > REACH)
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: distance,
      feasible: { kind: "range", minimum: 0, maximum: REACH, unit: "m" },
      reason: `the target lies ${distance.toFixed(3)} m from the release, beyond a loop's ${REACH} m`,
      fix: "ride closer to the animal before the throw",
    });
  const g: number = AutoMovieGravity.STANDARD;
  const velocity: IAutoMovieVector3 = {
    x: (at.x - out.x) / flight,
    y: (at.y - out.y) / flight + 0.5 * g * flight,
    z: (at.z - out.z) / flight,
  };

  // The wrist at the circle's front until the swing begins, round the circle, then reaching out to the throw's point.
  const circled = (t: number): IAutoMovieVector3 => {
    const angle: number = (2 * Math.PI * (t - phase0)) / period;
    return Vector3.add(
      centre,
      Vector3.add(
        Vector3.scale(forward, SWING.radius * Math.cos(angle)),
        Vector3.scale(left, SWING.radius * Math.sin(angle)),
      ),
    );
  };
  const wrist = (t: number): IAutoMovieVector3 =>
    t <= phase0
      ? arrival
      : t <= reach
        ? circled(t)
        : Vector3.lerp(
            circled(reach),
            thrown,
            Math.min(1, (t - reach) / SWING.throw),
          );
  const windows: IAutoMovieMotionHumanContactWindow[] = StrikingHeld.grips(
    tool,
  ).map(
    (
      w: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow => ({
      ...w,
      to: Math.min(w.to, release / duration),
    }),
  );
  if (params.dally !== undefined)
    windows.push({
      part: "rightHand",
      kind: "grip",
      from: caught / duration,
      to: 1,
      support: { kind: "prop", subject: params.on },
    });
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      ...Array.from({ length: params.swings }, (_: unknown, k: number) => ({
        name: `swing:${k}`,
        share: (phase0 + k * period) / duration,
      })),
      { name: "release", share: release / duration },
      { name: "catch", share: caught / duration },
      ...(params.dally === undefined
        ? []
        : [
            {
              name: "dallied",
              share: (caught + turns * SWING.turn) / duration,
            },
          ]),
    ],
    contacts: [
      {
        part: "seat",
        kind: "seat",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: params.on },
      },
      ...windows,
    ],
    base: entered,
    holds: StrikingHeld.holds(context, tool),
    launches: [
      {
        prop: params.lariat,
        seconds: context.start + release,
        point: out,
        velocity,
      },
    ],
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const film: number = context.start + t;
      const placed: IAutoMovieRigidTransform = carrier(film);
      // The wrist on its circle, then out to the throw; after the release it
      // comes back to the horn while the loop flies and dallies round it, or
      // without a dally stays where the throw left it, so the arm runs on
      // from the throw with no seam. The hand's turn is left to the arm and
      // the elbow hung from the body; laid in the carrier's frame.
      let point: IAutoMovieVector3 = t <= release ? wrist(t) : thrown;
      if (t > release && params.dally !== undefined) {
        const horn: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(placed.rotation),
          Vector3.subtract(
            HumanMountedFrame.contact(support, params.dally.horn, film),
            placed.position,
          ),
        );
        const angle: number =
          2 * Math.PI * Math.min(turns, Math.max(0, t - caught) / SWING.turn);
        const wrap: IAutoMovieVector3 = Vector3.add(horn, {
          x: SWING.wrap * Math.cos(angle),
          y: 0.02,
          z: SWING.wrap * Math.sin(angle),
        });
        point =
          t < caught
            ? Vector3.lerp(
                thrown,
                wrap,
                minimumJerk.share((t - release) / flight),
              )
            : wrap;
      }
      const swung: IAutoMovieMotionHumanPosture = {
        ...local,
        limbs: {
          ...local.limbs,
          rightArm: {
            point,
            bend: AutoMovieMotionHumanBend.hang(context.body, local, "right"),
            elbow: "strain",
          },
        },
      };
      return HumanMountedFrame.move(swung, HumanMountedFrame.LOCAL, placed);
    },
  };
  // The swinging arm is laid as a planned course on the wrist's circle, paced at the swing's own peak speed: the wrist's, or a hand point's a hand's length out as the hand turns once a turn of the circle; the reach into the swing, the swing held to the release; after it the plan's own goal carries the arm on from the throw to the horn and round it.
  let peak: number =
    (2 * Math.PI * (SWING.radius + context.body.measure.hand)) / period;
  for (let k: number = 1; k <= 64; ++k) {
    const a: number = (release * (k - 1)) / 64;
    const b: number = (release * k) / 64;
    peak = Math.max(peak, Vector3.distance(wrist(b), wrist(a)) / (b - a));
  }
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (laid: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        context,
        plan: laid,
        side: "right",
        span: {
          start: 0,
          ready: phase0,
          relax: release,
          end: release,
        },
        pace: (): number => peak,
      }),
  );
}
