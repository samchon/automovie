import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
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
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanPoloHand } from "./HumanPoloHand";

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

/** The head's angles in the swing's plane from the contact, degrees: the carry, the mallet upright over the shoulder; the top of the backswing past it; the follow-through (provisional). */
const ANGLES: Readonly<Record<"carry" | "top" | "finish", number>> = {
  carry: -210,
  top: -225,
  finish: 80,
};

/** The wrist's deviation range, degrees: radial 20, ulnar 30 (the AAOS normal ranges, read through secondary summaries). The top of the backswing cocks the wrist to the radial end, the double pendulum's hinge. */
const DEVIATION: Readonly<Record<"radial" | "ulnar", number>> = {
  radial: 20,
  ulnar: 30,
};

/** The elbow's flexion through the swing, degrees: the arm nearly straight, off its reach singularity (provisional). */
const ELBOW: number = 15;

/** The trunk's turn toward the swing's side through the stroke, degrees: the shoulders turned so the swinging arm passes beside the trunk rather than behind it (provisional, within the trunk's axial range). */
const TURN: number = 45;

/** How near the contact the mallet's head is held to the ball's place, seconds: half a frame of a 24 fps film, the instant the film shows. */
const HIT: number = 1 / 48;

/** The most a rider leans out of the saddle, degrees (provisional). */
const MOST: number = 45;

/** The bone whose joint is the swing's centre: the right shoulder. */
const SHOULDER: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["rightUpperArm"]);

/** How far the rider rises in the stirrups, metres (provisional). */
const RISE: number = 0.1;

/** How far the trunk pitches forward over the swing, degrees (provisional). */
const PITCH: number = 20;

/**
 * A polo stroke from the saddle (`IAutoMovieMotionHumanPolo`, #3955): carried on the saddle, the rider rises in the stirrups, leans out over the side and turns the shoulders toward it; the arm and the held mallet turn as one about the right shoulder in the plane through the ball and the horse's level heading, the mallet at the angle the grip and the wrist's deviation give, from the upright carry back to the cocked top of the backswing, down through the ball at the contact and on to the finish; the ball is launched along the swing at the contact. Register `HumanPolo` to use it.
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
     * @evidence contracts/development/common.md#meaningful-documentation States the steps and the refusals: a non-seated entry, a bad lean, speed or contact time, a ball whose distance from the shoulder no wrist deviation within its range meets, and a swing whose head would pass through the horse.
     * @evidence contracts/development/implementation.md#principled-implementation The shoulder is the leaned and turned posture's own right shoulder joint, resolved in the carrier contact's frame; the wrist stands the arm's reach at the elbow's flexion from it, the held mallet square to the fingers as the grip holds it and turned further by the wrist's deviation, so the head's distance from the shoulder is a closed form of the deviation, solved for the ball's; the arm and the mallet turn rigidly about the shoulder, the head's angle following minimum-jerk pieces between the phase instants and the deviation running from neutral at the carry to the radial end at the top and the solved one at the contact; the head is held to the ball only at the contact, the hand's turn elsewhere asked as a rotation the course meets as closely as the arm allows.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the plane, the station, the refusals, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable ball or a swing into the horse is refused, never bent.
     * @evidence contracts/development/implementation.md#efficient-algorithms One tool read, at most twenty-six shoulder resolves restricted to the upper arm for the lean's bisection, and seventeen clearance samples per plan; a sample reads one carrier frame and writes one arm goal.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The plane, the tool and the hand's geometry are shared by every sample.
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

  // The rider rises, pitches forward, turns the shoulders toward the swing's side (positive turns toward the left) and leans out until the right shoulder is over the ball's line, at most the admitted lean: the swing then turns in an upright plane outside the horse, the arm beside the trunk.
  const m = context.body.measure;
  const turn: number = sign * TURN;
  const chest: readonly [number, number, number] = local.joints.chest ?? [
    0, 0, 0,
  ];
  const spine: readonly [number, number, number] = local.joints.spine ?? [
    0, 0, 0,
  ];
  const posed = (degrees: number): IAutoMovieMotionHumanPosture => ({
    ...local,
    root: Vector3.add(local.root, { x: 0, y: RISE, z: 0 }),
    pitch: local.pitch + PITCH,
    roll: local.roll - sign * degrees,
    joints: {
      ...local.joints,
      chest: [
        chest[0],
        chest[1],
        chest[2] + AutoMovieMotionHumanTrunk.CHEST * turn,
      ],
      spine: [
        spine[0],
        spine[1],
        spine[2] + (1 - AutoMovieMotionHumanTrunk.CHEST) * turn,
      ],
    },
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

  // The swing's plane: through the leaned shoulder and the ball, holding the horse's level heading.
  const toBall: IAutoMovieVector3 = Vector3.subtract(ball, shoulder);
  const radius: number = Vector3.length(toBall);
  const u: IAutoMovieVector3 = Vector3.normalize(toBall);
  const forward: IAutoMovieVector3 = {
    x: 0,
    y: 0,
    z: params.stroke === "forehand" ? 1 : -1,
  };
  const w: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(forward, Vector3.scale(u, Vector3.dot(forward, u))),
  );
  const normal: IAutoMovieVector3 = Vector3.cross(u, w);
  const radial = (r: number): IAutoMovieVector3 =>
    Vector3.add(Vector3.scale(u, Math.cos(r)), Vector3.scale(w, Math.sin(r)));
  const along = (r: number): IAutoMovieVector3 =>
    Vector3.add(Vector3.scale(u, -Math.sin(r)), Vector3.scale(w, Math.cos(r)));

  // The hand's own frame at rest, the held mallet square to the fingers as the grip holds it, and the head from the wrist in that frame.
  const {
    fingers,
    shaft: shaftRest,
    along: vF,
    out: vT,
    across: vN,
  }: HumanPoloHand.IHand = HumanPoloHand.of(context.body, "right", tool);
  // The wrist stands the arm's reach at the elbow's flexion from the shoulder; the swing's centre is set off the plane by the head's own offset across the hand, so the head turns in the plane through the ball.
  const reach: number = Math.sqrt(
    m.upperArm * m.upperArm +
      m.forearm * m.forearm +
      2 * m.upperArm * m.forearm * Math.cos((ELBOW * Math.PI) / 180),
  );
  const d: number = Math.sqrt(Math.max(0, reach * reach - vN * vN));
  const centre: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(normal, vN),
  );
  // The head in the plane against the arm's line for a deviation (positive ulnar): along the arm, and along its way round.
  const outward = (deviation: number): number =>
    d + vF * Math.cos(deviation) - vT * Math.sin(deviation);
  const sideways = (deviation: number): number =>
    -vF * Math.sin(deviation) - vT * Math.cos(deviation);
  const distanceAt = (deviation: number): number =>
    Math.hypot(outward(deviation), sideways(deviation));
  // The contact's deviation: the head as far from the shoulder as the ball, a closed form.
  const radialEnd: number = (-DEVIATION.radial * Math.PI) / 180;
  const ulnarEnd: number = (DEVIATION.ulnar * Math.PI) / 180;
  const cosine: number =
    (radius * radius - d * d - vF * vF - vT * vT) /
    (2 * d * Math.hypot(vF, vT));
  const deviated: number =
    Math.abs(cosine) <= 1 ? Math.acos(cosine) - Math.atan2(vT, vF) : NaN;
  if (!(deviated >= radialEnd && deviated <= ulnarEnd))
    throw new HumanRefusal({
      kind: "reach",
      axis: "ball",
      value: radius,
      feasible: {
        kind: "range",
        minimum: distanceAt(ulnarEnd),
        maximum: distanceAt(radialEnd),
        unit: "m",
      },
      reason: `the ball lies ${radius.toFixed(3)} m from the leaned shoulder, where the mallet's head reaches only ${distanceAt(ulnarEnd).toFixed(3)} to ${distanceAt(radialEnd).toFixed(3)} m within the wrist's deviation`,
      fix: "ride the horse closer to the ball, or lean further out",
    });

  // The instants, the head's angle and the wrist's deviation between them.
  const takeAway: number = contact - PHASES.down - PHASES.takeAway;
  const top: number = contact - PHASES.down;
  const finish: number = contact + PHASES.follow;
  const duration: number = finish + PHASES.settle;
  const share = (a: number, b: number, t: number): number =>
    minimumJerk.share(Math.min(1, Math.max(0, (t - a) / (b - a))));
  const theta = (t: number): number => {
    const piece = (a: number, b: number, from: number, to: number): number =>
      from + (to - from) * share(a, b, t);
    if (t < takeAway) return ANGLES.carry;
    if (t < top) return piece(takeAway, top, ANGLES.carry, ANGLES.top);
    if (t < contact) return piece(top, contact, ANGLES.top, 0);
    return piece(contact, finish, 0, ANGLES.finish);
  };
  const deviation = (t: number): number => {
    if (t < takeAway) return 0;
    if (t < top) return radialEnd * share(takeAway, top, t);
    if (t < contact)
      return radialEnd + (deviated - radialEnd) * share(top, contact, t);
    return deviated;
  };
  // The arm and the mallet as one: the arm's line ahead of the head by the angle the deviation leaves between them.
  const station = (t: number): HumanPoloHand.IStation => {
    const dev: number = deviation(t);
    const arm: number =
      (theta(t) * Math.PI) / 180 - Math.atan2(sideways(dev), outward(dev));
    const r: IAutoMovieVector3 = radial(arm);
    const a: IAutoMovieVector3 = along(arm);
    const toward: IAutoMovieVector3 = Vector3.subtract(
      Vector3.scale(r, Math.cos(dev)),
      Vector3.scale(a, Math.sin(dev)),
    );
    const shaft: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        Vector3.scale(r, Math.sin(dev)),
        Vector3.scale(a, Math.cos(dev)),
      ),
      -1,
    );
    const wrist: IAutoMovieVector3 = Vector3.add(centre, Vector3.scale(r, d));
    return {
      wrist,
      rotation: HumanHand.align(
        { normal: fingers, forward: shaftRest },
        { normal: toward, forward: shaft },
      ),
      head: Vector3.add(
        wrist,
        Vector3.add(
          Vector3.add(Vector3.scale(toward, vF), Vector3.scale(shaft, vT)),
          Vector3.scale(normal, -vN),
        ),
      ),
    };
  };

  // The swing's head must stay clear of the horse: outside the straddle's half width wherever it is below the seat.
  const feet: number[] = (["left", "right"] as const)
    .map((side) => local.limbs[`${side}Leg`]?.point)
    .filter((p): p is IAutoMovieVector3 => p !== undefined)
    .map((p: IAutoMovieVector3): number => Math.abs(p.x));
  const flank: number =
    feet.length === 0 ? m.hipHalfWidth : Math.max(...feet) - m.shankRadius;
  for (let k: number = 0; k <= 16; ++k) {
    const t: number = top + ((finish - top) * k) / 16;
    const p: IAutoMovieVector3 = station(t).head;
    if (Math.abs(p.x) < flank && p.y < 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "side",
        value: params.side,
        feasible: null,
        reason: `the mallet's head would pass through the horse at ${theta(t).toFixed(0)} degrees of the swing`,
        fix: "strike a ball further out from the horse",
      });
  }

  const into = (t: number): number =>
    share(takeAway - PHASES.lean, takeAway, t) *
    (1 - share(finish, finish + PHASES.settle, t));
  const held = StrikingHeld.prepareGoal(context, tool, 0);
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    "right",
    "grip",
  ).point;

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
      // Before the lean begins the arm is the entry's; from it on the plan writes the swing's goal to the end, so the course reads it everywhere it lays the arm.
      if (t < takeAway - PHASES.lean)
        return HumanMountedFrame.move(local, HumanMountedFrame.LOCAL, now);
      const shown: IAutoMovieMotionHumanPosture = mixHumanPosture(
        local,
        leaned,
        into(t),
      );
      const at: HumanPoloHand.IStation = station(t);
      // The elbow hung from the body, as the sword strokes leave it (`StrikingBlade`); the head held to the ball only at the contact.
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
        context.body,
        shown,
        "right",
      );
      const goal: IAutoMovieHumanLimbGoal =
        Math.abs(t - contact) <= HIT
          ? held(
              {
                point: Vector3.add(
                  at.wrist,
                  Quaternion.rotateVector(at.rotation, grip),
                ),
                rotation: at.rotation,
              },
              bend,
            )
          : { point: at.wrist, rotation: at.rotation, bend, elbow: "strain" };
      return HumanMountedFrame.move(
        { ...shown, limbs: { ...shown.limbs, rightArm: goal } },
        HumanMountedFrame.LOCAL,
        now,
      );
    },
  };
  // The swinging arm is laid as a planned course: the reach into the carry over the lean, the swing held from the take-away to the finish at the wrist's own peak speed, the return in the settle.
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
      Vector3.distance(station(b).wrist, station(a).wrist) / (b - a),
    );
  }
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (laid: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        body: context.body,
        plan: laid,
        side: "right",
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
        span,
        pace: (): number => peak,
      }),
  );
}
