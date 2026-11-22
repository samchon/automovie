import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPolo,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPolo>;

/** The phases' durations, seconds (provisional stage readings of a polo swing). */
const PHASES: Readonly<
  Record<"lean" | "takeAway" | "down" | "follow" | "settle", number>
> = {
  lean: 0.4,
  takeAway: 0.5,
  down: 0.4,
  follow: 0.35,
  settle: 0.6,
};

/** The swing's angles in its plane from the contact, degrees: the mallet carried upright, the top of the backswing past it, the follow-through (provisional). */
const ANGLES: Readonly<Record<"carry" | "top" | "finish", number>> = {
  carry: -180,
  top: -225,
  finish: 80,
};

/** The most a rider leans out of the saddle, degrees (provisional). */
const MOST: number = 45;

/** The bone whose joint is the swing's centre: the right shoulder. */
const SHOULDER: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
  "rightUpperArm",
]);

/** How far the rider rises in the stirrups, metres (provisional). */
const RISE: number = 0.1;

/** How far the trunk pitches forward over the swing, degrees (provisional). */
const PITCH: number = 20;

/**
 * A polo stroke from the saddle (`IAutoMovieMotionHumanPolo`, #3955): carried on the saddle, the rider rises in the stirrups and leans out over the side; the mallet's head sweeps a circle about the right shoulder in the plane through the ball and the horse's level heading, from the upright carry back to the top of the backswing, down through the ball at the contact and on to the finish, the hand placed so the held mallet's head is on the circle (`StrikingHeld`); the ball is launched along the swing at the contact. Register `HumanPolo` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the swing's geometry, the launch and how it is registered.
 * @evidence contracts/development/design.md#principled-representation One law over the side and stroke literals, a swing as an angle in a plane, and the held mallet's own geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law's name, cut table and planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball is the ball prop's own place at the contact; the mallet's length is its held geometry.
 */
export const HumanPolo: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPolo> =
  {
    name: "polo",
    interrupts: {},
    /**
     * Admit the stroke, lay the swing's plane at the contact, then sample.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the steps and the refusals: a non-seated entry, a bad lean, speed or contact time, a ball out of the mallet's reach from the leaned shoulder, and a swing whose head would pass through the horse.
     * @evidence contracts/development/implementation.md#principled-implementation The shoulder is the leaned posture's own right shoulder joint, resolved in the carrier contact's frame; the swing radius is the shoulder's distance to the ball, the hand that far less the mallet's working length from the shoulder; the head's angle follows minimum-jerk pieces between the phase instants.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the plane, the refusals, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable ball or a swing into the horse is refused, never bent.
     * @evidence contracts/development/implementation.md#efficient-algorithms One tool read, at most twenty-six shoulder resolves restricted to the upper arm for the lean's bisection, and sixteen clearance samples per plan; a sample reads one carrier frame and fits one arm goal.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The plane and the tool are shared by every sample.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the plane, the tool and the carrier reader.
     */
    plan(context: Context): IAutoMovieMotionHumanActionPlan {
      return plan(context);
    },
  };

/** Admit, lay the plane and sample. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanPolo = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["ride", "mounted"] },
      reason: `a polo stroke is made from the saddle, and the performer is ${entered.kind}`,
      fix: "ride the horse first",
    });
  const lean: number = params.lean ?? MOST;
  HumanBound.above("lean", lean, 0, "deg");
  HumanBound.within("lean", lean, 0, MOST);
  const speed: number = params.speed ?? 20;
  HumanBound.above("speed", speed, 0, "m/s");
  const contact: number = params.contact;
  const ahead: number = PHASES.lean + PHASES.takeAway + PHASES.down;
  HumanBound.least("contact", contact, ahead, "s");

  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
    support,
    params.on,
    params.frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.of(
    context,
    "right",
    params.mallet,
    { tip: "head", edge: "face" },
  );

  // The ball at the contact, in the carrier contact's frame.
  const sign: number = params.side === "offside" ? -1 : 1;
  const local: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    entry,
    origin,
    HumanMountedFrame.LOCAL,
  );
  const struck: number = context.start + contact;
  const atContact: IAutoMovieRigidTransform = carrier(struck);
  const ballWorld: IAutoMovieVector3 = context
    .prop(params.ball)
    .frame(struck).position;
  const ball: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(atContact.rotation),
    Vector3.subtract(ballWorld, atContact.position),
  );

  // The rider rises, pitches forward and leans out until the right shoulder is over the ball's line, at most the admitted lean: the swing then turns in an upright plane outside the horse.
  const m = context.body.measure;
  const posed = (degrees: number): IAutoMovieMotionHumanPosture => ({
    ...local,
    root: Vector3.add(local.root, { x: 0, y: RISE, z: 0 }),
    pitch: local.pitch + PITCH,
    roll: local.roll - sign * degrees,
  });
  // The right shoulder joint where the leaned trunk actually places it: the posture resolved for the upper arm alone, its arms' goals left out.
  const shoulderAt = (degrees: number): IAutoMovieVector3 =>
    poseBones(
      context.body,
      resolveHumanPosture.seeded(
        context.body,
        { ...posed(degrees), limbs: {} },
        undefined,
        {},
        undefined,
        SHOULDER,
      ).pose,
      undefined,
      SHOULDER,
    ).get("rightUpperArm")!.worldPosition;
  // The shoulder's reach out over the side grows with the lean: bisect for the lean whose shoulder meets the ball's line.
  let low: number = 0;
  let high: number = lean;
  if (sign * (shoulderAt(high).x - ball.x) < 0)
    for (let k: number = 0; k < 24; ++k) {
      const mid: number = (low + high) / 2;
      if (sign * (shoulderAt(mid).x - ball.x) < 0) low = mid;
      else high = mid;
    }
  const leaning: number = high;
  const leaned: IAutoMovieMotionHumanPosture = posed(leaning);
  const shoulder: IAutoMovieVector3 = shoulderAt(leaning);

  // The swing's circle: about the leaned shoulder through the ball, holding the horse's level heading.
  const centre: IAutoMovieVector3 = shoulder;
  const toBall: IAutoMovieVector3 = Vector3.subtract(ball, centre);
  const radius: number = Vector3.length(toBall);
  const arm: number = m.upperArm + m.forearm + 0.5 * m.hand;
  const u: IAutoMovieVector3 = Vector3.normalize(toBall);
  const forward: IAutoMovieVector3 = {
    x: 0,
    y: 0,
    z: params.stroke === "forehand" ? 1 : -1,
  };
  const w: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(forward, Vector3.scale(u, Vector3.dot(forward, u))),
  );
  const head = (theta: number): IAutoMovieVector3 => {
    const r: number = (theta * Math.PI) / 180;
    return Vector3.add(
      centre,
      Vector3.add(
        Vector3.scale(u, radius * Math.cos(r)),
        Vector3.scale(w, radius * Math.sin(r)),
      ),
    );
  };
  // The hand holds the mallet's working length behind its head, toward the circle's centre: every hand station of the swing, the carry's too, lies on the radius, the radius less the mallet from the leaned shoulder.
  const hand = (theta: number): IAutoMovieVector3 => {
    const at: IAutoMovieVector3 = head(theta);
    return Vector3.subtract(
      at,
      Vector3.scale(
        Vector3.normalize(Vector3.subtract(at, centre)),
        tool.length,
      ),
    );
  };
  const station: number = radius - tool.length;
  if (station < 0 || station > arm)
    throw new HumanRefusal({
      kind: "reach",
      axis: "ball",
      value: station,
      feasible: { kind: "range", minimum: 0, maximum: arm, unit: "m" },
      reason: `the swing through the ball holds the hand ${station.toFixed(3)} m from the leaned shoulder, outside the arm's 0 to ${arm.toFixed(3)} m`,
      fix: "ride the horse closer to the ball, or lean further out",
    });
  // The swing's head must stay clear of the horse: outside the straddle's half width wherever it is below the seat.
  const feet: number[] = (["left", "right"] as const)
    .map((side) => local.limbs[`${side}Leg`]?.point)
    .filter((p): p is IAutoMovieVector3 => p !== undefined)
    .map((p: IAutoMovieVector3): number => Math.abs(p.x));
  const flank: number =
    feet.length === 0 ? m.hipHalfWidth : Math.max(...feet) - m.shankRadius;
  for (let k: number = 0; k <= 16; ++k) {
    const theta: number = ANGLES.top + ((ANGLES.finish - ANGLES.top) * k) / 16;
    const p: IAutoMovieVector3 = head(theta);
    if (Math.abs(p.x) < flank && p.y < 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "side",
        value: params.side,
        feasible: null,
        reason: `the mallet's head would pass through the horse at ${theta.toFixed(0)} degrees of the swing`,
        fix: "strike a ball further out from the horse",
      });
  }

  // The instants and the head's angle between them.
  const takeAway: number = contact - PHASES.down - PHASES.takeAway;
  const top: number = contact - PHASES.down;
  const finish: number = contact + PHASES.follow;
  const duration: number = finish + PHASES.settle;
  const theta = (t: number): number => {
    const piece = (a: number, b: number, from: number, to: number): number =>
      from +
      (to - from) *
        minimumJerk.share(Math.min(1, Math.max(0, (t - a) / (b - a))));
    if (t < takeAway) return ANGLES.carry;
    if (t < top) return piece(takeAway, top, ANGLES.carry, ANGLES.top);
    if (t < contact) return piece(top, contact, ANGLES.top, 0);
    return piece(contact, finish, 0, ANGLES.finish);
  };
  const into = (t: number): number =>
    minimumJerk.share(
      Math.min(1, Math.max(0, (t - (takeAway - PHASES.lean)) / PHASES.lean)),
    ) *
    (1 -
      minimumJerk.share(
        Math.min(1, Math.max(0, (t - finish) / PHASES.settle)),
      ));
  const goal = StrikingHeld.prepareGoal(context, tool, 0);

  // The ball leaves along the head's travel at the contact.
  const travel: IAutoMovieVector3 = Quaternion.rotateVector(
    atContact.rotation,
    w,
  );
  const grips: IAutoMovieMotionHumanContactWindow[] = StrikingHeld.grips(tool);
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "takeAway", share: takeAway / duration },
      { name: "top", share: top / duration },
      { name: "contact", share: contact / duration },
      { name: "finish", share: finish / duration },
    ],
    contacts: [
      ...grips,
      ...(["left", "right"] as const)
        .filter((s) => context.entry.feet[s].planted)
        .map(
          (s): IAutoMovieMotionHumanContactWindow => ({
            part: `${s}Foot`,
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: params.on },
          }),
        ),
    ],
    base: entered,
    holds: StrikingHeld.holds(context, tool),
    launches: [
      {
        prop: params.ball,
        seconds: struck,
        point: ballWorld,
        velocity: Vector3.scale(Vector3.normalize({ ...travel, y: 0 }), speed),
      },
    ],
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const now: IAutoMovieRigidTransform = carrier(context.start + t);
      const share: number = into(t);
      const shown: IAutoMovieMotionHumanPosture = mixHumanPosture(
        local,
        leaned,
        share,
      );
      // Before the lean begins the arm is the entry's; from it on the plan writes the swing's goal to the end, so the course reads it everywhere it lays the arm.
      if (t < takeAway - PHASES.lean)
        return HumanMountedFrame.move(local, HumanMountedFrame.LOCAL, now);
      const at: IAutoMovieVector3 = head(theta(t));
      const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        StrikingHeld.hand(tool, 0, at, Vector3.subtract(at, centre), w);
      const swung: IAutoMovieMotionHumanPosture = {
        ...shown,
        limbs: {
          ...shown.limbs,
          rightArm: goal(
            frame,
            Vector3.add(shoulder, { x: -0.6, y: -0.3, z: -0.4 }),
          ),
        },
      };
      return HumanMountedFrame.move(swung, HumanMountedFrame.LOCAL, now);
    },
  };
  // The swinging arm is laid as a planned course on the head's circle: the reach into the carry over the lean, the swing held from the take-away to the finish at the swing's own peak speed, the return in the settle.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: Math.max(0, takeAway - PHASES.lean),
    ready: takeAway,
    relax: finish,
    end: duration,
  };
  let peak: number = 0;
  for (let k: number = 1; k <= 64; ++k) {
    const a: number = takeAway + ((finish - takeAway) * (k - 1)) / 64;
    const b: number = takeAway + ((finish - takeAway) * k) / 64;
    peak = Math.max(
      peak,
      Vector3.distance(hand(theta(b)), hand(theta(a))) / (b - a),
    );
  }
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (local: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        body: context.body,
        plan: local,
        side: "right",
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
        span,
        pace: (): number => peak,
      }),
  );
}
