import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBikeGuide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionPrepared } from "../compose/AutoMovieMotionPrepared";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticProp } from "../sport/AquaticProp";
import { HumanBikeGuideHeading } from "./HumanBikeGuideHeading";
import { HumanBikeGuidePath } from "./HumanBikeGuidePath";
import { HumanBikeGuidePlace } from "./HumanBikeGuidePlace";
import { HumanBikeGuidePrint } from "./HumanBikeGuidePrint";
import type { IHumanBikeGuidePrint } from "./IHumanBikeGuidePrint";

/** Path samples per second of the bicycle's course read at planning, Hz. */
const RATE: number = 60;

/**
 * The guiding station's root outward of the grip, metres: provisional, a
 * shoulder's reach beside the handlebar.
 */
const STATION: number = 0.15;

/** The guiding station's root behind the grip, metres: provisional. */
const BEHIND: number = 0.1;

/** Seconds to move from the entered place to the guiding station: provisional. */
const ADJUST: number = 0.8;

/**
 * Seconds the hand takes to reach the grip: it closes as the athlete arrives at
 * the station.
 */
const REACH: number = ADJUST;

/**
 * Wheel a bicycle by hand beside it, as a triathlete does through the
 * transition lane. The scene's course rolls the bicycle, with any stop it
 * makes; the athlete keeps the entered place beside it, so the root follows the
 * bicycle's frame, and the near hand holds that side's handlebar grip on the
 * posed bicycle. The path is stepped run by run between the bicycle's stops,
 * each run closed with the feet together. Steps are laid along the root's path:
 * a normal walking step of 0.41 stature, lengthened to keep a running cadence
 * where the bicycle is faster at the step's start, then a closing step that
 * brings the feet together where the bicycle stops. A foot lands when the root
 * has come half a step short of its print and swings for at most the swing time
 * before that, after the other foot has landed, so a foot stays planted while
 * the bicycle pauses. The pelvis lowers only as far as the longer leg needs to
 * reach its foot.
 *
 * Events: `take` when the hand closes on the grip, `step{k}` at each landing
 * and `release` at the end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who owns the path, the step rule with its sources and provisional values, the landing and swing timing, the pelvis rule and the events.
 */
function planHumanBikeGuide(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBikeGuide>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params, start }: typeof context = context;
  const duration: number = params.duration;
  if (!(duration > REACH))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: duration,
      feasible: {
        kind: "range",
        minimum: REACH,
        maximum: null,
        unit: "s",
      },
      reason: "wheeling the bicycle lasts longer than the reach to its grip",
      fix: `give more than ${REACH} seconds`,
    });
  if (entry.base.kind !== "standing")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entry.base.kind,
      feasible: { kind: "alternatives", values: ["standing"] },
      reason: "wheeling a bicycle starts on the feet beside it",
      fix: "stand or run to the bicycle first",
    });
  const side: AutoMovieHumanSide = params.side ?? "left";
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const grip: string = `${side}Grip`;
  const bicycle: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  AquaticProp.at(bicycle, start).require(grip, "handle");

  // The entered root, held in the bicycle's frame, rides along its path.
  const origin: IAutoMovieRigidTransform = bicycle.frame(start);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
  const entered: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(entry.posture.root, origin.position),
  );

  // The athlete moves from the entered place to the guiding station
  // beside the grip, then keeps it: STATION outward of the grip and
  // BEHIND it, on the entered ground height.
  const handle: IAutoMovieVector3 = (bicycle.prop.affordances ?? []).find(
    (a: IAutoMovieAffordance): boolean => a.id === grip,
  )!.frame.translation;
  const station: IAutoMovieVector3 = {
    x: handle.x + Math.sign(handle.x || (side === "left" ? 1 : -1)) * STATION,
    y: entered.y,
    z: handle.z - BEHIND,
  };
  const held = (t: number): IAutoMovieVector3 =>
    Vector3.lerp(entered, station, minimumJerk.share(Math.min(1, t / ADJUST)));
  const heading0: number = HumanBikeGuideHeading(origin.rotation);
  const path: HumanBikeGuidePath.IPath = {
    times: [],
    distances: [],
    points: [],
    turns: [],
  };
  const count: number = Math.ceil(duration * RATE);
  for (let i: number = 0; i <= count; ++i) {
    const t: number = (duration * i) / count;
    const frame: IAutoMovieRigidTransform = bicycle.frame(start + t);
    const point: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, held(t)),
    );
    const last: IAutoMovieVector3 | undefined = path.points.at(-1);
    path.times.push(t);
    path.points.push(point);
    path.turns.push(HumanBikeGuideHeading(frame.rotation) - heading0);
    path.distances.push(
      last === undefined
        ? 0
        : path.distances.at(-1)! +
            Math.hypot(point.x - last.x, point.z - last.z),
    );
  }

  // The path moves in runs between the stops the bicycle makes; each run
  // is stepped on its own and closed with the feet together, so a foot
  // never stands left behind through a stop.
  const runs: readonly number[] = HumanBikeGuidePath.stops(path);
  const steps: HumanBikeGuidePath.IStep[] = [];
  let from: number = 0;
  for (const end of runs) {
    if (end - from > 1e-3)
      steps.push(
        ...HumanBikeGuidePath.run(path, from, end, body.measure.stature),
      );
    from = end;
  }

  // Footprints: the entered feet, then alternate prints along the path,
  // the far foot first.
  const enteredBones: ReturnType<typeof poseBones> = poseBones(
    body,
    entry.pose,
    undefined,
    new Set(["hips"]),
  );
  const hips: number = enteredBones.get("hips")!.worldPosition.y;
  const reach: Record<AutoMovieHumanSide, number> = {
    left: hips - entry.feet.left.ankle.y,
    right: hips - entry.feet.right.ankle.y,
  };
  const prints: Record<AutoMovieHumanSide, IHumanBikeGuidePrint[]> = {
    left: [
      HumanBikeGuidePrint(0, entry.feet.left.ankle, entry.feet.left.rotation),
    ],
    right: [
      HumanBikeGuidePrint(0, entry.feet.right.ankle, entry.feet.right.rotation),
    ],
  };
  const events: IAutoMovieMotionEvent[] = [
    { name: "take", share: REACH / duration },
  ];
  let previous: number = 0;
  steps.forEach((step: HumanBikeGuidePath.IStep, k: number): void => {
    const foot: AutoMovieHumanSide = k % 2 === 0 ? other : side;
    const land: number = Math.max(previous, step.land);
    const before: IHumanBikeGuidePrint = prints[foot].at(-1)!;
    before.lift = Math.max(
      previous,
      before.land,
      land - HumanBikeGuidePath.SWING,
    );
    const index: number = HumanBikeGuidePath.indexAt(path, step.at);
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      UP,
      path.turns[index]!,
    );
    const entered: IAutoMovieVector3 = entry.feet[foot].ankle;
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      turn,
      Vector3.subtract(entered, entry.posture.root),
    );
    prints[foot].push(
      HumanBikeGuidePrint(
        land,
        {
          x: path.points[index]!.x + offset.x,
          y: entered.y,
          z: path.points[index]!.z + offset.z,
        },
        Quaternion.multiply(turn, entry.feet[foot].rotation),
      ),
    );
    events.push({ name: `step${k + 1}`, share: land / duration });
    previous = land;
  });
  events.push({ name: "release", share: 1 });
  events.sort(
    (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
      a.share - b.share,
  );

  // Each print bears from its landing to its lift.
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: `${side}Hand`,
      kind: "grip",
      from: REACH / duration,
      to: 1,
      support: { kind: "prop", subject: params.on, carries: false },
    },
  ];
  for (const foot of ["left", "right"] as const)
    for (const one of prints[foot])
      contacts.push({
        part: `${foot}Foot`,
        kind: "plant",
        from: one.land / duration,
        to: one.lift / duration,
        support: { kind: "ground" },
      });

  // The sole ball in each foot's frame, the axis the heel rises about.
  const balls: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: HumanFoot.offset(body, "left", "ball"),
    right: HumanFoot.offset(body, "right", "ball"),
  };

  // The near hand's hold rides the athlete's own pelvis: the grip on
  // the bicycle is read once, where the hand takes it, and kept in the
  // pelvis frame, so the hand goes with the walk without reading the
  // bicycle at a later second. It is solved when the plan is prepared, on
  // the bicycle as the placed performance shows it.
  const taken: AutoMovieMotionPrepared.IValue<IAutoMovieHumanLimbGoal> =
    AutoMovieMotionPrepared((): IAutoMovieHumanLimbGoal => {
      const at: IAutoMovieMotionHumanPosture = bodyAt(REACH);
      const world: IAutoMovieHumanLimbGoal = AquaticProp.hold(
        body,
        at,
        side,
        AquaticProp.at(bicycle, start + REACH).require(grip, "handle").world,
      );
      const pelvis: IAutoMovieResolvedBone = pelvisAt(at).get("hips")!;
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        pelvis.worldRotation,
      );
      const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          inverse,
          Vector3.subtract(point, pelvis.worldPosition),
        );
      return {
        ...world,
        on: "hips",
        point: local(world.point),
        bend: local(world.bend!),
        rotation: Quaternion.multiply(inverse, world.rotation!),
      };
    });
  // The body at a second, without the near arm's goal.
  const bodyAt: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    const frame: IAutoMovieRigidTransform = bicycle.frame(start + t);
    const along: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, held(t)),
    );
    const turn: number = HumanBikeGuideHeading(frame.rotation) - heading0;
    const feet: Record<AutoMovieHumanSide, IHumanBikeGuidePrint> = {
      left: HumanBikeGuidePlace(prints.left, t, balls.left),
      right: HumanBikeGuidePlace(prints.right, t, balls.right),
    };

    // Lower the pelvis only as far as a leg must to reach a foot that
    // has left its place under the hip, no farther than it stood.
    let drop: number = 0;
    const spin: IAutoMovieQuaternion = Quaternion.fromAxisAngle(UP, turn);
    for (const foot of ["left", "right"] as const) {
      const ankle: IAutoMovieVector3 = feet[foot].ankle;
      const under: IAutoMovieVector3 = Vector3.add(
        along,
        Quaternion.rotateVector(
          spin,
          Vector3.subtract(entry.feet[foot].ankle, entry.posture.root),
        ),
      );
      const across: number = Math.hypot(ankle.x - under.x, ankle.z - under.z);
      const height: number = hips - ankle.y;
      drop = Math.max(
        drop,
        height - Math.sqrt(Math.max(0, reach[foot] ** 2 - across * across)),
      );
    }
    const posture: IAutoMovieMotionHumanPosture = {
      ...entry.posture,
      root: { x: along.x, y: entry.posture.root.y - drop, z: along.z },
      yaw: entry.posture.yaw + turn,
      limbs: { ...entry.posture.limbs },
    };
    for (const foot of ["left", "right"] as const) {
      const now: IHumanBikeGuidePrint = feet[foot];
      posture.limbs[`${foot}Leg`] = {
        ...AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          foot,
          { ankle: now.ankle, rotation: now.rotation },
          now.lift >= t && now.land <= t,
        ),
        planted: now.lift >= t && now.land <= t,
      };
    }

    return posture;
  };
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration,
    events,
    contacts,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = bodyAt(seconds);
      posture.limbs[`${side}Arm`] = taken.read();
      return posture;
    },
    prepare: (): void => void taken.prepare(),
  };
  const pelvisAt: (
    posture: IAutoMovieMotionHumanPosture,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(
      body,
      resolveHumanPosture(body, posture),
      undefined,
      HumanBoneGroups.HIPS,
    );

  // The near arm reaches from the entered arm to the grip by `REACH`
  // and holds it as one admitted course (`courseArmGoal`).
  return courseArmGoal({
    context,
    plan,
    side,
    rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
    span: { start: 0, ready: REACH, relax: duration, end: duration },
  });
}

/**
 * Wheel a bicycle by hand beside it, as a triathlete does through the
 * transition lane. The scene's course rolls the bicycle, with any stop it
 * makes; the athlete keeps the entered place beside it, so the root follows the
 * bicycle's frame, and the near hand holds that side's handlebar grip on the
 * posed bicycle. The path is stepped run by run between the bicycle's stops,
 * each run closed with the feet together. Steps are laid along the root's path:
 * a normal walking step of 0.41 stature, lengthened to keep a running cadence
 * where the bicycle is faster at the step's start, then a closing step that
 * brings the feet together where the bicycle stops. A foot lands when the root
 * has come half a step short of its print and swings for at most the swing time
 * before that, after the other foot has landed, so a foot stays planted while
 * the bicycle pauses. The pelvis lowers only as far as the longer leg needs to
 * reach its foot.
 *
 * Events: `take` when the hand closes on the grip, `step{k}` at each landing
 * and `release` at the end.
 */
export const HumanBikeGuide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBikeGuide> =
  {
    name: "bikeGuide",
    interrupts: {},
    yields: [],
    plan: planHumanBikeGuide,
  };

/** The world up axis. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
