import {
  Quaternion,
  Vector3,
  minimumJerk,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanChannel,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCaneSweep,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanWornItem } from "../dressing/HumanWornItem";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

/**
 * How far beyond the body's widest part the tip touches, metres: about an inch
 * (Kim, Wall Emerson and Naghshineh 2017, the arc about one inch beyond the
 * widest part of the body).
 */
const BEYOND: number = 0.025;

/**
 * The most the tip rises between touches, metres: no more than an inch above
 * the ground (APH, Orientation and mobility, the two-point touch).
 */
const LIFT: number = 0.025;

/**
 * How far ahead of the hips the cane hand is held, as a share of the forearm
 * (provisional: the arm reached forward at the midline, the elbow a little
 * bent).
 */
const AHEAD: number = 0.8;

/**
 * The rate the walk's steps are read at, per second: two 60 Hz frames resolve a
 * landing.
 */
const RATE: number = 60;

/**
 * How far before its span ends the arm leaves the cane pose, seconds
 * (provisional: a short return).
 */
const RETURN: number = 0.3;

/** How long the arm takes to the cane pose, seconds (provisional: a reach). */
const REACH: number = 0.5;

/** One touch: when, and on which side of the walker the tip comes down. */
interface ITouch {
  /** Seconds since the sweep's start. */
  at: number;

  /** The walker's side the tip touches: opposite the foot that lands. */
  side: AutoMovieHumanSide;
}

/**
 * Sweep a long cane while walking, performed over the walk. The cane hand is
 * held at the midline, `AHEAD` of the forearm before the hips at the waist's
 * height (the hand's place in the walker's moving frame). The walk's own steps
 * are read from its posture at `RATE`: each instant a leg's goal becomes
 * planted while the hand holds the cane pose (after the `REACH` to it and
 * before the `RETURN` from it) is a landing, and at each landing the tip
 * touches the floor on the opposite side, `BEYOND` outside the body's widest
 * part (the shoulder and the upper arm), as the two-point touch places it.
 * Between two touches the tip crosses on a minimum-jerk share, lifted at most
 * `LIFT` (two-point) or sliding on the floor (constant contact); before the
 * first touch and after the last it rests on that touch's place. At every
 * second the tip's reach ahead is solved so the hand's grip, held on the cane
 * as the cane was taken up, spans from the midline to the tip, the cane swung
 * onto that line and turned about it so the thumb's side points as near up as
 * it can: the handshake grip (Washington State School for the Blind, "White
 * Cane Technique - 2 Point Touch": the cane held "almost like ... shaking
 * hands", the index finger out), whose sweep comes from the wrist side to side
 * and never from rolling it (Guide Dogs UK, "Touch technique with your long
 * cane": "All the movement should be from your wrist. It should be a
 * side-to-side movement rather than a rolling movement"); the hand that holds
 * it is placed for that frame (`HumanWornItem.holding`) and laid as one course
 * (`courseArmGoal`), under a grip window on the cane that keeps it in the hand
 * and a hold that leaves it there; the hand it drives keeps that hold's grip,
 * the fingers it held the cane with as the sweep was entered. Each touch is a
 * waypoint of the arm's course (`courseArmGoal.knotted`). Events: `touch<n>`. A
 * cane too short to reach the floor ahead, or a walk with no landing in the
 * span, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hand's place, how steps are read, the touch rule, the crossing, the cane's frame, the course with its touch waypoints, the hold's grip the driven hand keeps, the events and the refusals.
 */
function planHumanCaneSweep(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCaneSweep>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanCaneSweep = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  HumanBound.above("duration", p.duration, 0, "s");
  const side: AutoMovieHumanSide = p.hand ?? "right";
  const carrier: IAutoMovieMotionHumanActionContext["carrier"] =
    context.carrier;
  if (carrier === undefined)
    throw new HumanRefusal({
      kind: "base",
      axis: "carrier",
      value: null,
      reason: "a cane is swept over a walk",
      fix: "perform the sweep over a walk",
    });
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    p.prop,
  );
  const site = (id: string): IAutoMovieVector3 => {
    const found: IAutoMovieAffordance | undefined = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: p.prop,
        reason: `${p.prop} declares no ${id} for a long cane`,
        fix: "give the cane a grip and a tip",
      });
    return found.frame.translation;
  };
  const tipLocal: IAutoMovieVector3 = site("tip");
  // The hand on the cane as it took the cane up (`held.frame`, the cane in
  // the hand's grip frame): the grip socket's place and the hand's attitude
  // in the cane's frame, and the socket's distance to the tip.
  const inHand: IAutoMovieQuaternion = Quaternion.inverse(held.frame.rotation);
  const gripLocal: IAutoMovieVector3 = Vector3.scale(
    Quaternion.rotateVector(inHand, held.frame.position),
    -1,
  );
  const length: number = Vector3.distance(gripLocal, tipLocal);
  const shaft: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(gripLocal, tipLocal),
  );
  // The hand's thumb side, the rig hand's +Z, in the cane's frame.
  const thumb: IAutoMovieVector3 = Quaternion.rotateVector(inHand, {
    x: 0,
    y: 0,
    z: 1,
  });
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const wide: number = m.shoulderHalfWidth + m.upperArmRadius + BEYOND;

  // The walk's landings, from its planted legs, while the hand holds the
  // cane pose: after the reach to it and before the return from it.
  const ready: number = Math.min(REACH, p.duration / 2);
  const relax: number = Math.max(p.duration / 2, p.duration - RETURN);
  const touches: ITouch[] = [];
  const steps: number = Math.ceil(p.duration * RATE);
  let before: Record<AutoMovieHumanSide, boolean> | undefined;
  for (let k: number = 0; k <= steps; ++k) {
    const t: number = (k / steps) * p.duration;
    if (t < ready || t > relax) continue;
    const posture: IAutoMovieMotionHumanPosture = carrier.posture(t);
    const now: Record<AutoMovieHumanSide, boolean> = {
      left: posture.limbs.leftLeg?.planted === true,
      right: posture.limbs.rightLeg?.planted === true,
    };
    if (before !== undefined)
      for (const foot of ["left", "right"] as const)
        if (now[foot] && !before[foot])
          touches.push({ at: t, side: foot === "left" ? "right" : "left" });
    before = now;
  }
  if (touches.length === 0)
    throw new HumanRefusal({
      kind: "base",
      axis: "duration",
      value: p.duration,
      reason: "the walk lands no foot within the sweep",
      fix: "sweep over a walk of at least one step",
    });

  // The cane's frame at a second: the hand's grip at the midline, the tip at
  // its touch, and the cane turned about its shaft so the thumb stays on top.
  const frameAt = (seconds: number): IAutoMovieRigidTransform => {
    const posture: IAutoMovieMotionHumanPosture = carrier.posture(seconds);
    const frame: IAutoMovieMotionHumanFrame = {
      origin: posture.root,
      yaw: posture.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.forward(posture.yaw);
    const hand: IAutoMovieVector3 = {
      ...HumanFrame.point(frame, { x: 0, y: 0, z: AHEAD * m.forearm }),
      y: m.waistHeight,
    };
    let i: number = touches.findIndex(
      (touch: ITouch): boolean => touch.at > seconds,
    );
    if (i === -1) i = touches.length;
    const sideOf = (touch: ITouch): number => (touch.side === "left" ? 1 : -1);
    let lateral: number;
    let height: number = 0;
    if (i === 0) lateral = sideOf(touches[0]!) * wide;
    else if (i === touches.length) lateral = sideOf(touches.at(-1)!) * wide;
    else {
      const a: ITouch = touches[i - 1]!;
      const b: ITouch = touches[i]!;
      const s: number = (seconds - a.at) / (b.at - a.at);
      lateral =
        (sideOf(a) + (sideOf(b) - sideOf(a)) * minimumJerk.share(s)) * wide;
      height =
        (p.technique ?? "twoPoint") === "twoPoint"
          ? LIFT * Math.sin(Math.PI * s)
          : 0;
    }
    const drop: number = hand.y - height;
    const ahead2: number = length * length - drop * drop - lateral * lateral;
    if (ahead2 <= 0)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: p.prop,
        reason: `the cane's ${(length * 1000).toFixed(0)} mm from grip to tip does not reach the floor beside the body from the hand at ${(hand.y * 1000).toFixed(0)} mm`,
        fix: "use a cane fitted to the sternum",
      });
    const left: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
    const tip: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        { x: hand.x, y: height, z: hand.z },
        Vector3.scale(forward, Math.sqrt(ahead2)),
      ),
      Vector3.scale(left, lateral),
    );
    // The shaft from the tip to the grip, turned onto the world's tip-to-hand
    // line by the shortest arc (the swing of a swing-twist decomposition,
    // Dobrowolski 2015, arXiv:1506.05481, section 2.1), then turned about
    // that line so the thumb's side points as near up as it can: the
    // handshake grip, the sweep made by the wrist side to side and never by
    // rolling it.
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(hand, tip),
    );
    const swung: IAutoMovieQuaternion = rotationBetween(shaft, line);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const across = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(line, Vector3.dot(v, line)));
    const turned: IAutoMovieVector3 = across(
      Quaternion.rotateVector(swung, thumb),
    );
    const above: IAutoMovieVector3 = across(up);
    const roll: number = Math.atan2(
      Vector3.dot(Vector3.cross(turned, above), line),
      Vector3.dot(turned, above),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(line, (roll * 180) / Math.PI),
        swung,
      ),
    );
    return {
      position: Vector3.subtract(
        tip,
        Quaternion.rotateVector(rotation, tipLocal),
      ),
      rotation,
    };
  };
  const duration: number = p.duration;
  const limb: courseArmGoal.Limb = side === "left" ? "leftArm" : "rightArm";

  const channels: readonly AutoMovieMotionHumanChannel[] = [
    limb,
    side === "left" ? "leftHand" : "rightHand",
  ];
  const under: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );

  // The sweep takes the hold of the cane over for its span, so the hand
  // it drives shows that hold's grip, the fingers the hand held the cane
  // with as the sweep was entered: a held object's hand keeps its grip
  // across actions (contacts.md, "Held objects"), as the violin's bow
  // hand writes its hold's fingers (`bowViolin`). The carrier's own
  // fingers would open the grip as the overlay comes in.
  const hold: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  const grip: IAutoMovieMotionHumanPosture["joints"] = hold.fingers ?? {};

  // The held hand is driven only under a grip on its prop, which keeps
  // the cane in it through the sweep and leaves it held after.
  const goals: IAutoMovieMotionHumanActionPlan = {
    ...under,
    events: touches.map(
      (touch: ITouch, n: number): IAutoMovieMotionEvent => ({
        name: `touch${n + 1}`,
        share: touch.at / duration,
      }),
    ),
    contacts: [...under.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [hold],
    channels,
    enteredChannels: channels,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const base: IAutoMovieMotionHumanPosture = carrier.posture(seconds);
      const target: IAutoMovieMotionHumanArmTarget.ITarget =
        HumanWornItem.holding(
          body,
          side,
          held,
          frameAt(seconds),
          AutoMovieMotionHumanBend.hang(body, base, side, 0.2),
        );
      return {
        ...base,
        joints: { ...base.joints, ...grip },
        limbs: {
          ...base.limbs,
          [limb]: {
            ...HumanHand.place(
              body,
              side,
              "grip",
              target.point,
              target.rotation,
            ),
            bend: target.bend,
          },
        },
      };
    },
  };
  return courseArmGoal({
    context,
    plan: goals,
    side,
    span: { start: 0, ready, relax, end: duration },
  });
}

/**
 * Sweep a long cane while walking, performed over the walk. The cane hand is
 * held at the midline, `AHEAD` of the forearm before the hips at the waist's
 * height (the hand's place in the walker's moving frame). The walk's own steps
 * are read from its posture at `RATE`: each instant a leg's goal becomes
 * planted while the hand holds the cane pose (after the `REACH` to it and
 * before the `RETURN` from it) is a landing, and at each landing the tip
 * touches the floor on the opposite side, `BEYOND` outside the body's widest
 * part (the shoulder and the upper arm), as the two-point touch places it.
 * Between two touches the tip crosses on a minimum-jerk share, lifted at most
 * `LIFT` (two-point) or sliding on the floor (constant contact); before the
 * first touch and after the last it rests on that touch's place. At every
 * second the tip's reach ahead is solved so the hand's grip, held on the cane
 * as the cane was taken up, spans from the midline to the tip, the cane swung
 * onto that line and turned about it so the thumb's side points as near up as
 * it can: the handshake grip (Washington State School for the Blind, "White
 * Cane Technique - 2 Point Touch": the cane held "almost like ... shaking
 * hands", the index finger out), whose sweep comes from the wrist side to side
 * and never from rolling it (Guide Dogs UK, "Touch technique with your long
 * cane": "All the movement should be from your wrist. It should be a
 * side-to-side movement rather than a rolling movement"); the hand that holds
 * it is placed for that frame (`HumanWornItem.holding`) and laid as one course
 * (`courseArmGoal`), under a grip window on the cane that keeps it in the hand
 * and a hold that leaves it there; the hand it drives keeps that hold's grip,
 * the fingers it held the cane with as the sweep was entered. Each touch is a
 * waypoint of the arm's course (`courseArmGoal.knotted`). Events: `touch<n>`. A
 * cane too short to reach the floor ahead, or a walk with no landing in the
 * span, is refused.
 */
export const HumanCaneSweep: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCaneSweep> =
  {
    name: "caneSweep",
    interrupts: {},
    overlay: true,
    plan: planHumanCaneSweep,
  };
