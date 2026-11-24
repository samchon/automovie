import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanUnseat,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmReach } from "../compose/AutoMovieMotionHumanArmReach";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KnockdownFloor } from "../reaction/KnockdownFloor";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatDrag } from "./HumanUnseatDrag";
import { HumanUnseatFlight } from "./HumanUnseatFlight";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanUnseat>;

/** A fall's push away from the saddle. */
interface IPush {
  /** Its direction in the carrier's frame, `+X` toward the falling side. */
  direction: IAutoMovieVector3;

  /** Its speed, metres per second. */
  speed: number;
}

/**
 * Each fall's push, in the carrier's frame with `+X` toward the falling side
 * (provisional stage readings).
 */
const PUSHES: Readonly<Record<IAutoMovieMotionHumanUnseat.Fall, IPush>> = {
  back: { direction: { x: 0, y: 0.3, z: -1 }, speed: 1.5 },
  side: { direction: { x: 1, y: 0.4, z: 0 }, speed: 1.5 },
  forward: { direction: { x: 0, y: 0.6, z: 1 }, speed: 2 },
  pullDown: { direction: { x: 1, y: -0.3, z: 0 }, speed: 2 },
  drag: { direction: { x: 1, y: 0.2, z: -0.3 }, speed: 1 },
  clear: { direction: { x: 1, y: 0.5, z: 0 }, speed: 1.5 },
  slump: { direction: { x: 1, y: 0, z: 0 }, speed: 0.5 },
};

/** Seconds either side the release velocity is read over. */
const STEP: number = 1 / 240;

/**
 * Admit the fall, find the release, solve the flight or the drag once, then
 * sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steps and the refusals: a non-seated entry, a bad instant, speed or time, a release outside the act, a drag without its stirrup and a fall that would pass through the carrier.
 * @evidence contracts/development/implementation.md#principled-implementation Before the release the entry posture is carried by the carrier's contact (`HumanMountedFrame.move`); the release velocity is the carried root's central difference; the flight is `HumanUnseatFlight`'s closed form; the shape blends from the carried posture to the lie by the minimum-jerk share of the flight; the falling hand's way to the floor is one planned arm course in the world (courseArmGoal), clear of the trunk and the thighs, leaving from the seat's arm at the release instant and reaching the floor by the touch; its palm, not its wrist, lies on the floor (the goal's point is the wrist's), palm down at the heading about the vertical nearest the fingers-out one that the lying arm meets (`AutoMovieMotionHumanArmReach`, Tolani et al. 2000), since a flat palm bears alike at any heading.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, release, the fall's path, windows, then the sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A fall that would cross the carrier's flank below the seat is refused, never bent around it; a palm the lying arm cannot lay flat at any heading is refused with its least miss, never clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms One lie fit, one flight, one heading search for the palm and one arm course per plan; a sample reads at most two carrier frames and one stirrup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The lie, the flight and the release state are shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its flight, lie and the carrier reader.
 */
function planHumanUnseat(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/**
 * A rider leaving a moving saddle (`IAutoMovieMotionHumanUnseat`): carried on
 * the saddle until the release, then flying from the saddle's own velocity with
 * the fall's push built over `HumanUnseatFlight.TAKE` (no jump in velocity),
 * turning onto the back as the knockdown's fitted lie (`KnockdownFloor`) with
 * the head along the fall and the falling side's hand reaching the floor first,
 * and sliding to a stop; or dragged on the floor behind a foot held in its
 * stirrup until a breakaway stirrup frees it; or stepping clear onto the feet;
 * or slumping over the neck, held by the saddle and a hand in the mane, or
 * sliding off. Register `HumanUnseat` to use it.
 */
export const HumanUnseat: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanUnseat> =
  {
    name: "unseat",
    interrupts: {},
    plan: planHumanUnseat,
  };

/** Admit the fall, find the release and sample its path. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanUnseat = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["sit", "ride", "mounted"] },
      reason: `a rider leaves a saddle they sit in, and the performer is ${entered.kind}`,
      fix: "sit on the carrier first",
    });
  HumanBound.least("release", params.release ?? 0, 0, "s");
  HumanBound.least("lie", params.lie ?? 1, 0, "s");
  if (params.push !== undefined)
    HumanBound.above("push", params.push, 0, "m/s");
  if (params.free !== undefined) HumanBound.above("free", params.free, 0, "s");
  if (params.fall === "drag" && params.stirrup === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stirrup",
      value: undefined,
      feasible: null,
      reason: "a drag holds the foot in a stirrup, and none is named",
      fix: "name the stirrup contact the foot stays in",
    });

  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
    support,
    params.on,
    params.frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const carried = (t: number): IAutoMovieMotionHumanPosture =>
    HumanMountedFrame.move(entry, origin, carrier(context.start + t));
  const side: AutoMovieHumanSide = params.side ?? "left";
  const lie: number = params.lie ?? 1;

  // The release: the cue's first instant inside the act, as a hit, or the authored second.
  let release: number = params.release ?? 0;
  if (params.cue !== undefined) {
    const hit: number | undefined = context
      .cue(params.cue)
      .map((c): number => c.seconds - context.start)
      .filter((t: number): boolean => t >= 0)
      .sort((a: number, b: number): number => a - b)[0];
    if (hit === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cue",
        value: params.cue,
        feasible: null,
        reason: `the cue track ${params.cue} has no instant inside the act`,
        fix: "cue the hit after the act begins",
      });
    release = hit;
  }
  const slumping: boolean = params.fall === "slump";
  const leave: number = release + (slumping ? HumanUnseatPose.SLUMP : 0);
  const slumpAt = (t: number): number =>
    slumping
      ? minimumJerk.share(
          Math.min(1, Math.max(0, (t - release) / HumanUnseatPose.SLUMP)),
        )
      : 0;
  const seatedAt = (t: number): IAutoMovieMotionHumanPosture =>
    HumanUnseatPose.slumped(carried(t), slumpAt(t));

  // A slumped rider who stays on is carried to the end, the hand in the mane.
  if (slumping && params.stays !== false) {
    const duration: number = leave + lie;
    const mane = (film: number): IAutoMovieVector3 | undefined =>
      params.mane === undefined
        ? undefined
        : HumanMountedFrame.contact(support, params.mane, film);
    return {
      duration,
      events: [{ name: "slump", share: release / duration }],
      contacts: [
        window("seat", "seat", 0, 1, params.on),
        ...(params.mane === undefined
          ? []
          : [
              window(
                `${other(side)}Hand`,
                "grip",
                leave / duration,
                1,
                params.on,
              ),
            ]),
      ],
      base: entered,
      posture: (at: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, at));
        const shown: IAutoMovieMotionHumanPosture = seatedAt(t);
        const point: IAutoMovieVector3 | undefined = mane(context.start + t);
        return point === undefined
          ? shown
          : HumanUnseatPose.reach(shown, other(side), point, slumpAt(t));
      },
    };
  }

  // The release state: the carried root's own velocity, and the fall's push turned with the carrier.
  const at: IAutoMovieMotionHumanPosture = seatedAt(leave);
  const velocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(
      seatedAt(leave + STEP).root,
      seatedAt(Math.max(0, leave - STEP)).root,
    ),
    1 / (leave + STEP - Math.max(0, leave - STEP)),
  );
  const turn: IAutoMovieRigidTransform = carrier(context.start + leave);
  const sign: number = side === "left" ? 1 : -1;
  const push: IAutoMovieVector3 = Vector3.scale(
    Quaternion.rotateVector(
      turn.rotation,
      Vector3.normalize({
        ...PUSHES[params.fall].direction,
        x: sign * PUSHES[params.fall].direction.x,
      }),
    ),
    params.push ?? PUSHES[params.fall].speed,
  );

  // The lie it lands into and the height its root lies or stands at.
  const lying: KnockdownFloor.IFold = KnockdownFloor.fold(
    KnockdownFloor.fit(context.body, 1),
    1,
    1,
  );
  const standing: boolean = params.fall === "clear";
  const floor: number = standing
    ? HumanUnseatPose.standingHeight(context.body)
    : KnockdownFloor.prepareMeasure(context.body)(lying).floor;

  if (params.fall === "drag")
    return HumanUnseatDrag.drag({
      context,
      support,
      carrier,
      seatedAt,
      release: leave,
      stirrup: params.stirrup!,
      side,
      free: params.free,
      lie,
      lying,
      floor,
      window,
    });

  const flight: HumanUnseatFlight.IFlight = HumanUnseatFlight.of(
    at.root,
    velocity,
    push,
    floor,
  );
  if (
    push.x * sign !== 0 &&
    params.fall !== "back" &&
    params.fall !== "forward"
  )
    HumanUnseatPose.clearsFlank(
      context.body,
      entry,
      origin,
      carrier,
      context.start + leave,
      flight,
    );
  const travel: IAutoMovieVector3 = {
    ...Vector3.subtract(flight.landed, at.root),
    y: 0,
  };
  const facing: number = standing
    ? at.yaw
    : (Math.atan2(-travel.x, -travel.z) * 180) / Math.PI;
  const land: number = leave + flight.land;
  const duration: number = land + Math.max(lie, flight.stop);
  // The flying body, without the reaching hand, at a local second.
  const flown = (t: number): IAutoMovieMotionHumanPosture => {
    const u: number = Math.max(0, t - leave);
    return HumanUnseatPose.flying(
      context.body,
      at,
      standing ? HumanUnseatPose.STAND : lying,
      facing,
      HumanUnseatFlight.at(flight, u),
      minimumJerk.share(flight.land === 0 ? 1 : Math.min(1, u / flight.land)),
    );
  };
  // The falling hand meets the floor beside the hip at the first instant of the flight that brings it within the arm's reach, at the latest at the landing.
  const reached: number | undefined = standing
    ? land
    : HumanUnseatPose.reachable(
        context.body,
        side,
        leave,
        land,
        flown,
        (t: number) => HumanUnseatPose.beside(flown(t), side, context.body),
      );
  if (reached === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "fall",
      value: context.start + land,
      feasible: null,
      reason: `the falling ${side} hand cannot reach the floor beside the hip before the landing at film second ${(context.start + land).toFixed(3)}`,
      fix: "fall from lower, or to the other side",
    });
  const touch: number = reached;
  const hand: string = `${side}Hand`;
  const before: number = leave / duration;

  // The flying body with the falling hand sent to its place beside the
  // shoulder, at a local second after the release.
  const reaching = (t: number): IAutoMovieMotionHumanPosture => {
    const shown: IAutoMovieMotionHumanPosture = flown(t);
    return HumanUnseatPose.reach(
      shown,
      side,
      HumanUnseatPose.beside(shown, side, context.body),
      1,
    );
  };
  // The palm bears on the floor at the hand's place, palm down. The goal's
  // point is the wrist's, so it stands the palm's offset off that place,
  // turned with the hand: the palm, not the wrist, is on the floor.
  const palm: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    "palm",
  ).point;
  const onFloor = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 => ({
    ...posture.limbs[`${side}Arm`]!.point,
    y: 0,
  });
  const palmDown = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieQuaternion =>
    HumanHand.rotation(side, {
      fingers: Quaternion.rotateVector(
        humanPostureHeading({ yaw: posture.yaw, pitch: 0, roll: 0 }),
        { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      ),
      palm: { x: 0, y: -1, z: 0 },
    });
  // A palm flat on the floor bears alike at any heading about the vertical,
  // so the hand asks palm down with the fingers out to the side, turned about
  // the vertical to the nearest heading the arm meets on the lie it holds it
  // through (`AutoMovieMotionHumanArmReach`), chosen once at the landing: the
  // fingers-out heading asks the lying arm's forearm past its twist, and the
  // hand that misses it pitches its fingers through the floor.
  const heading: number = standing
    ? 0
    : ((): number => {
        const lain: IAutoMovieMotionHumanPosture = reaching(land);
        return AutoMovieMotionHumanArmReach.attitude({
          body: context.body,
          posture: lain,
          side,
          bend: lain.limbs[`${side}Arm`]!.bend,
          requested: palmDown(lain),
          axis: { x: 0, y: 1, z: 0 },
          wrist: (rotation: IAutoMovieQuaternion): IAutoMovieVector3 =>
            Vector3.subtract(
              onFloor(lain),
              Quaternion.rotateVector(rotation, palm),
            ),
          name: "fall",
        }).turn;
      })();
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "release", share: before },
      ...(standing ? [] : [{ name: "touch", share: touch / duration }]),
      { name: "land", share: land / duration },
    ],
    contacts: [
      window("seat", "seat", 0, before, params.on),
      ...(["left", "right"] as const)
        .filter(
          (s: AutoMovieHumanSide): boolean => context.entry.feet[s].planted,
        )
        .map((s: AutoMovieHumanSide) =>
          window(`${s}Foot`, "plant", 0, before, params.on),
        ),
      ...(standing
        ? (["leftFoot", "rightFoot"] as const).map((part) =>
            window(part, "plant", land / duration, 1),
          )
        : [
            window(hand, "plant", touch / duration, 1),
            window("back", "lie", land / duration, 1),
          ]),
    ],
    base: { kind: standing ? "standing" : "lying" },
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      // The release instant is still the seat's: the body leaves it with the
      // seat's own pose (the flight starts from it), and the falling hand's
      // course leaves from the arm shown there, which the course reads off
      // this plan at its span's start.
      if (t <= leave) return seatedAt(t);
      // After the release the falling hand's goal is its place on the floor beside the shoulder, which the course reaches by the touch.
      if (standing) return flown(t);
      const reached: IAutoMovieMotionHumanPosture = reaching(t);
      // The palm on the floor at its reachable heading, from the touch on; until then the goal is only where the course is bound.
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
          palmDown(reached),
        ),
      );
      const floor: IAutoMovieHumanLimbGoal = reached.limbs[`${side}Arm`]!;
      reached.limbs = {
        ...reached.limbs,
        [`${side}Arm`]: {
          ...floor,
          point: Vector3.subtract(
            onFloor(reached),
            Quaternion.rotateVector(rotation, palm),
          ),
          contact: palm,
          rotation,
          planted: t >= touch,
        },
      };
      return reached;
    },
  };
  if (standing) return goals;
  // The falling body flies free of any carrier, so the hand's way to the floor is laid as one planned course in the world: the reach from the release to the touch, clear of the trunk and the thighs, then the hold on the floor. Before the release the carried seat is shown as the law gives it, the course read only from the release on.
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: goals,
    side,
    // The course leaves from the arm shown at the release: the carried seat's, not the entry's.
    rest: AutoMovieMotionHumanArm.angles(
      resolveHumanPosture(context.body, seatedAt(leave)),
      side,
    ),
    span: { start: leave, ready: touch, relax: duration, end: duration },
  });
  return {
    ...coursed,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ) => (args[0] < leave ? goals.posture(...args) : coursed.posture(...args)),
  };
}
/** A contact window over shares of the act, on the carrier or the ground. */
function window(
  part: string,
  kind: IAutoMovieMotionHumanContactWindow["kind"],
  from: number,
  to: number,
  on?: string,
): IAutoMovieMotionHumanContactWindow {
  return {
    part: part as IAutoMovieMotionHumanContactWindow["part"],
    kind,
    from,
    to,
    support:
      on === undefined ? { kind: "ground" } : { kind: "prop", subject: on },
  };
}

/** The other side. */
function other(side: AutoMovieHumanSide): AutoMovieHumanSide {
  return side === "left" ? "right" : "left";
}
