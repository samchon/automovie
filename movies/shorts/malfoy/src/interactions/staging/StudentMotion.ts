import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyMeasure } from "../../laws/body/IBodyMeasure";
import type { IBodyPosture } from "../../laws/body/IBodyPosture";
import type { IBodyState } from "../../laws/body/IBodyState";
import { DuelLaw } from "../../laws/duelling/DuelLaw";
import { WandShape } from "../../laws/duelling/WandShape";
import { BendShape } from "../../laws/everyday/BendShape";
import { EverydayLaw } from "../../laws/everyday/EverydayLaw";
import { FaceTouchShape } from "../../laws/everyday/FaceTouchShape";
import { Gait } from "../../laws/everyday/Gait";
import { GiveRoomShape } from "../../laws/everyday/GiveRoomShape";
import { ReachShape } from "../../laws/everyday/ReachShape";
import { SitShape } from "../../laws/everyday/SitShape";
import { RiderMotion } from "../flight/RiderMotion";
import type { IStageWorld } from "./IStageWorld";
import { StudentPose } from "./StudentPose";

/**
 * A student's posture at any second of one action: the resting posture
 * before the action's lead ends, then a blend from the start state's posture
 * to the end state's, shaped by the action's own path: whole steps with
 * planted feet for walks, turns and steps; the lean-descend-settle of a sit;
 * hand arcs to the forehead, the glasses, the mouth, the floor or a handover
 * point and back; the duel's flick, sweep, raised shield and underarm turn;
 * a rider's seat on the moving broom. Pure in the instant.
 *
 * ```ts
 * StudentMotion.posture(student, step, local, seconds, locate);
 * ```
 *
 * @evidence docs/research/everyday/walking.md#gait Feet swing for 82% of each step and stay planted otherwise; the pelvis bobs; arms swing opposite.
 * @evidence docs/research/everyday/sitting.md#stand-to-sit Pre-squat lean, squat, stabilization with planted feet.
 * @evidence docs/research/everyday/handover.md#law Reach, transfer and withdrawal paths; the floor reach.
 * @evidence docs/research/duelling/practice-duel.md#law Aim, flick, sweep, shield, grip and underarm turn.
 * @evidence docs/body/settings/cast/carina-malfoy.md#forehead-touch About a second at the forehead.
 * @evidence docs/body/settings/cast/harry-potter.md#pushes-glasses Finger to the bridge and back.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation A pure function of the step and the instant.
 * @evidence contracts/development/behaviors.md#relational-goals Hand goals read the points the laws resolved against the counterpart.
 * @evidence contracts/development/common.md#meaningful-documentation States the shape of each action's path.
 */
export namespace StudentMotion {
  /**
   * The posture of a step at a local time.
   *
   * @param student The student.
   * @param step The schedule's step.
   * @param local Seconds since the step's start.
   * @param seconds Film seconds.
   * @param locate Positions of other subjects now.
   * @param host The front rider's live broom, for a rear rider or a transfer.
   * @param live The rider's own live broom.
   * @returns The posture.
   */
  export function posture(student: Student, step: IStageWorld.IStudentStep, local: number, seconds: number, locate: StudentPose.Locate, host?: RiderMotion.IBroom, live?: RiderMotion.IBroom): IBodyPosture {
    const m = student.measure;
    const phase: number = breathPhase(student.id);
    const a = step.action;
    if (step.from.support === "ride" || step.from.support === "hang" || step.from.support === "tandem" || step.to.support === "ride" || step.to.support === "tandem" || step.to.support === "hang")
      return RiderMotion.posture(student, step, local, seconds, locate, phase, host, live);
    const own: number = Math.max(0, local - step.lead);
    const u: number = step.natural > 0 ? Math.min(1, own / step.natural) : 1;
    const p0: IBodyPosture = StudentPose.of(step.from, m, locate, seconds, phase);
    if (local < step.lead) return p0;
    const p1: IBodyPosture = StudentPose.of(step.to, m, locate, seconds, phase);
    const e: number = smooth(u);
    switch (a.kind) {
      case "walk": {
        const walked: IBodyPosture = walking(student, step, own, p0, p1, seconds, phase, locate);
        // A forehead touch or a glasses push laid over the walk, from its own second into the walk.
        if (a.gesture === undefined) return walked;
        const g = a.gesture;
        return FaceTouchShape.posture(walked, g.kind, g.hand, own - g.after, EverydayLaw.TIMES[g.kind].duration, m);
      }
      case "step":
      case "run":
      case "guide":
      case "footwork":
        return walking(student, step, own, p0, p1, seconds, phase, locate);
      case "giveRoom": {
        // The palms come up as the step back begins, so they never reach into the person given room.
        // The palms ride the moving body's own chest frame, so they face the way he faces at every instant of the step back.
        const moved: IBodyPosture = walking(student, step, Math.max(0, own - GiveRoomShape.STEP_BEGINS), p0, p1, seconds, phase, locate);
        const k: number = GiveRoomShape.raised(own);
        for (const side of ["left", "right"] as const)
          if (step.to.hands[side].place === "palms-out") {
            const palm = GiveRoomShape.palm(moved, side, m);
            moved.hands[side] = { point: lerp(p0.hands[side].point, palm.point, k), elbow: lerp(p0.hands[side].elbow, palm.elbow, k), palm: palm.palm };
          }
        return moved;
      }
      case "turn":
        return walking(student, step, own, p0, p1, seconds, phase, locate);
      case "sit":
      case "rise":
        return a.kind === "sit" ? SitShape.posture(p0, p1, u) : SitShape.posture(p1, p0, 1 - u);
      case "touchForehead":
      case "pushGlasses":
        return FaceTouchShape.posture(blend(p0, p1, e), a.kind, a.hand, own, step.natural, m);
      case "liftChin": {
        // The chin lifts about 10° and the shoulders square, held, then ease back.
        const result: IBodyPosture = blend(p0, p1, e);
        const k: number = smooth(Math.max(0, Math.min(1, own / 0.2, (step.natural - own) / 0.2)));
        result.headPitch -= EverydayLaw.CHIN_LIFT * k;
        result.twist *= 1 - k;
        result.lean *= 1 - 0.5 * k;
        return result;
      }
      case "drink":
      case "read": {
        const side = a.kind === "read" ? "right" : holdingSide(step.from, a.prop);
        const up: number = m.shoulder - m.hip;
        const target: IAutoMovieVector3 = a.kind === "drink" ? StudentPose.onTrunk(p0, 0.14, 0.03, up + 0.07) : StudentPose.onTrunk(p0, 0.32, -0.05, up - 0.08);
        const rise: number = Math.min(1, own / 0.3);
        const fall: number = Math.min(1, Math.max(0, (step.natural - own) / 0.3));
        const k: number = smooth(Math.min(rise, fall));
        const result: IBodyPosture = blend(p0, p1, e);
        result.hands[side] = { ...result.hands[side], point: lerp(result.hands[side].point, target, k) };
        if (a.kind === "read") result.headPitch += 0.35 * k;
        if (a.kind === "drink") result.headPitch -= 0.25 * k;
        return result;
      }
      case "offer":
      case "receive":
      case "catch":
      case "putDown":
      case "pickUp":
      case "grip":
      case "launch":
        return reaching(step, own, p0, p1, m);
      case "reachAfter": {
        const result: IBodyPosture = blend(p0, p1, e);
        const side = "right" as const;
        const f: IAutoMovieVector3 = BodyFrame.forward(step.from.heading);
        result.hands[side] = { ...result.hands[side], point: add(result.hands[side].point, f, 0.2 * Math.sin(Math.PI * Math.min(1, u * 0.5 + 0.5 * e))) };
        return result;
      }
      case "bend":
      case "straighten": {
        const result: IBodyPosture = blend(p0, p1, e);
        if (a.kind === "bend" && step.point !== undefined) {
          if (step.from.hands.right.holds === null) result.hands.right = { ...result.hands.right, point: BendShape.hand(result, step.point, a.depth, e) };
        }
        return result;
      }
      case "cast":
        return WandShape.cast(blend(p0, p1, e), step.from.heading, own);
      case "deflect":
        return WandShape.deflect(blend(p0, p1, e), step.from.heading, own, step.contact ?? DuelLaw.SWEEP);
      case "shield":
        return WandShape.shield(blend(p0, p1, e), m, own, step.natural);
      case "turnUnder":
        return WandShape.turnUnder(blend(p0, p1, e), m, step.from.heading, e);
      case "drawBack":
      case "drop":
      case "enter":
      case "escort":
      case "fail":
      case "fly":
      case "fold":
      case "guard":
      case "hide":
      case "hold":
      case "hover":
      case "letGo":
      case "levitate":
      case "look":
      case "lowerHand":
      case "mount":
      case "offerRear":
      case "openPalm":
      case "parry":
      case "pass":
      case "path":
      case "pocket":
      case "raise":
      case "reach":
      case "release":
      case "rest":
      case "say":
      case "scene":
      case "shift":
      case "shot":
      case "slip":
      case "stopPlay":
      case "strike":
      case "swingArm":
      case "transfer":
      case "unfold":
      case "until":
      case "wand":
      case "withdraw":
      default: {
        const result: IBodyPosture = blend(p0, p1, e);
        // Hands travelling between places lift a little through the middle of the move.
        for (const side of ["left", "right"] as const)
          if (step.from.hands[side].place !== step.to.hands[side].place)
            result.hands[side] = { ...result.hands[side], point: add(result.hands[side].point, { x: 0, y: 1, z: 0 }, 0.05 * Math.sin(Math.PI * u)) };
        return result;
      }
    }
  }

  /** A blend of two postures. */
  export function blend(a: IBodyPosture, b: IBodyPosture, k: number): IBodyPosture {
    return {
      pelvis: lerp(a.pelvis, b.pelvis, k),
      heading: a.heading + BodyFrame.turn(a.heading, b.heading) * k,
      pitch: a.pitch + (b.pitch - a.pitch) * k,
      roll: a.roll + (b.roll - a.roll) * k,
      lean: a.lean + (b.lean - a.lean) * k,
      twist: a.twist + (b.twist - a.twist) * k,
      headYaw: a.headYaw + (b.headYaw - a.headYaw) * k,
      headPitch: a.headPitch + (b.headPitch - a.headPitch) * k,
      feet: {
        left: { point: lerp(a.feet.left.point, b.feet.left.point, k), toes: lerp(a.feet.left.toes, b.feet.left.toes, k), knee: lerp(a.feet.left.knee, b.feet.left.knee, k) },
        right: { point: lerp(a.feet.right.point, b.feet.right.point, k), toes: lerp(a.feet.right.toes, b.feet.right.toes, k), knee: lerp(a.feet.right.knee, b.feet.right.knee, k) },
      },
      hands: {
        left: { point: lerp(a.hands.left.point, b.hands.left.point, k), elbow: lerp(a.hands.left.elbow, b.hands.left.elbow, k), palm: lerp(a.hands.left.palm, b.hands.left.palm, k) },
        right: { point: lerp(a.hands.right.point, b.hands.right.point, k), elbow: lerp(a.hands.right.elbow, b.hands.right.elbow, k), palm: lerp(a.hands.right.palm, b.hands.right.palm, k) },
      },
    };
  }

  /** Reaching actions: out to the step's point by the contact, then on to the end place, by the reach shape. */
  function reaching(step: IStageWorld.IStudentStep, own: number, p0: IBodyPosture, p1: IBodyPosture, m: IBodyMeasure): IBodyPosture {
    const a = step.action;
    const side: "left" | "right" =
      a.kind === "catch" || a.kind === "receive" ? a.hand : a.kind === "grip" ? "left" : a.kind === "offer" ? a.hand : a.kind === "putDown" ? holdingSide(step.from, a.prop) : "right";
    const target: IAutoMovieVector3 = step.point ?? p1.hands[side].point;
    return ReachShape.posture({
      from: p0,
      to: p1,
      side,
      point: a.kind === "pickUp" || a.kind === "putDown" ? { ...target, y: target.y + 0.03 } : target,
      contact: step.contact ?? step.natural,
      natural: step.natural,
      own,
      after: step.outcome === "withdrawn" || a.kind === "putDown" || a.kind === "pickUp" || a.kind === "catch" ? "return" : "stay",
      ...(a.kind === "pickUp" && step.point !== undefined && step.point.y < 0.3 ? { floor: { lean: 0.03, pelvis: m.hip - 0.01 } } : {}),
      ...(a.kind === "receive" && a.pull ? { pull: BodyFrame.forward(step.from.heading) } : {}),
    });
  }
  /** Stepping actions: whole steps along the floor with planted feet. */
  function walking(
    student: Student,
    step: IStageWorld.IStudentStep,
    own: number,
    p0: IBodyPosture,
    p1: IBodyPosture,
    seconds: number,
    phase: number,
    locate: StudentPose.Locate,
  ): IBodyPosture {
    const m = student.measure;
    const from: IBodyState = step.from;
    const to: IBodyState = step.to;
    // A walk bent around someone follows its two legs; every other move runs straight.
    const path: IAutoMovieVector3[] = step.action.kind === "walk" && step.route !== undefined && step.route.length > 2 ? step.route : [from.position, to.position];
    const distance: number = Gait.length(path);
    const period: number = step.walk?.period ?? 60 / Gait.PACES.ordinary.cadence;
    const steps: number = Math.max(2, step.walk?.steps ?? Math.max(2, Math.round(step.natural / period)));
    const plan: Gait.IPlan = step.walk && step.walk.steps > 0 ? step.walk : { steps, length: distance / Math.max(1, steps - 1), period: step.natural / steps, duration: step.natural, distance };
    const swing: Gait.ISwing = Gait.swing(plan, own);
    const travel: number = distance > Gait.STILL ? BodyFrame.headingTo(path[0]!, path[1]!) : to.heading;
    const arrive: number = distance > Gait.STILL ? BodyFrame.headingTo(path[path.length - 2]!, path[path.length - 1]!) : to.heading;
    // A walk of more than a step goes forward and turns to its end facing over the last step, even into a seat behind;
    // other moves face forward only when their end facing is near the travel.
    const ahead: boolean = Math.abs(BodyFrame.turn(from.heading, travel)) < Math.PI / 2;
    const forwardWalk: boolean =
      distance > Gait.STILL && step.action.kind !== "giveRoom" && ahead && (Math.abs(BodyFrame.turn(to.heading, arrive)) < (2 * Math.PI) / 3 || (step.action.kind === "walk" && distance > 0.6));
    const k: number = plan.steps <= 1 ? 1 : Math.min(1, own / plan.period);
    const last: number = Math.max(0, Math.min(1, (own - plan.period * (plan.steps - 1)) / plan.period));
    // Along a bent walk the body faces a point 0.35 m ahead on the path, so it turns smoothly through the bend.
    const here: IAutoMovieVector3 = Gait.along(path, swing.progress);
    const course: number = path.length > 2 && distance > Gait.STILL ? BodyFrame.headingTo(here, Gait.along(path, Math.min(1, swing.progress + 0.35 / distance))) : travel;
    const heading: number = forwardWalk
      ? from.heading + BodyFrame.turn(from.heading, swing.progress >= 1 - 1e-9 ? arrive : course) * smooth(k) + BodyFrame.turn(arrive, to.heading) * smooth(last)
      : from.heading + BodyFrame.turn(from.heading, to.heading) * smooth(swing.progress);
    // A move begun from a bend straightens over its first half second instead of snapping upright.
    const state: IBodyState = { ...from, position: here, heading, stance: from.stance, bend: from.bend * (1 - smooth(Math.min(1, own / 0.5))) };
    const result: IBodyPosture = blend(StudentPose.of(state, m, locate, seconds, phase), p1, 0);
    result.hands = blend(p0, p1, swing.progress).hands;
    result.pelvis = { ...result.pelvis, y: result.pelvis.y + Gait.BOB * (Math.abs(Math.sin(Math.PI * swing.swing)) - 0.5) };
    // Footprints: step k sets its foot down at the path point of min(1, k / (n ??1)).
    for (const side of ["left", "right"] as const) {
      const first: number = side === "left" ? 0 : 1; // the left foot takes the first step
      const placed = (count: number): IAutoMovieVector3 => {
        const share: number = plan.steps <= 1 ? 1 : Math.min(1, count / (plan.steps - 1));
        const point: IAutoMovieVector3 = Gait.along(path, share);
        const h: number = count <= 0 ? from.heading : count >= plan.steps ? to.heading : heading;
        return BodyFrame.toWorld({ ...point, y: 0 }, h, { forward: 0, left: (side === "left" ? 1 : -1) * (m.hipHalfWidth + 0.01), up: m.ankle });
      };
      const own_steps: number[] = [];
      for (let s = first; s < plan.steps; s += 2) own_steps.push(s);
      const done: number = own_steps.filter((s) => s < swing.step).length;
      const moving: boolean = own_steps.includes(swing.step) && swing.step < plan.steps;
      const before: IAutoMovieVector3 = done === 0 ? p0.feet[side].point : placed(own_steps[done - 1]! + 1);
      const after: IAutoMovieVector3 = moving ? placed(swing.step + 1) : before;
      const point: IAutoMovieVector3 = moving ? lerp(before, after, swing.swing) : swing.step >= plan.steps ? p1.feet[side].point : before;
      result.feet[side] = { ...result.feet[side], point: { ...point, y: point.y + (moving ? Gait.LIFT * Math.sin(Math.PI * swing.swing) : 0) } };
      // Arms swing opposite their legs when the hand is free at the side.
      if (from.hands[side].place === "side" && to.hands[side].place === "side") {
        const swingArm: number = Math.sin(Math.PI * (swing.step + swing.swing)) * (side === "left" ? -1 : 1);
        result.hands[side] = { ...result.hands[side], point: add(result.hands[side].point, BodyFrame.forward(heading), 0.12 * swingArm) };
      }
    }
    return result;
  }

  function holdingSide(state: IBodyState, prop: string): "left" | "right" {
    return state.hands.left.holds === prop ? "left" : "right";
  }

  /** A stable breath phase per person from the id's characters. */
  function breathPhase(id: string): number {
    let h: number = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 1000;
    return (h / 1000) * 2 * Math.PI;
  }

  function smooth(u: number): number {
    const c: number = Math.max(0, Math.min(1, u));
    return c * c * (3 - 2 * c);
  }

  function lerp(a: IAutoMovieVector3, b: IAutoMovieVector3, k: number): IAutoMovieVector3 {
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
  }

  function add(a: IAutoMovieVector3, d: IAutoMovieVector3, s: number): IAutoMovieVector3 {
    return { x: a.x + d.x * s, y: a.y + d.y * s, z: a.z + d.z * s };
  }

}
