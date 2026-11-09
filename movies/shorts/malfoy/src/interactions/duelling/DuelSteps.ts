import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import { BodyFrame } from "../../laws/body/BodyFrame";
import { IBodyState } from "../../laws/body/IBodyState";
import { DuelLaw } from "../../laws/duelling/DuelLaw";
import type { StageAction } from "../../laws/staging/StageAction";
import type { EverydaySteps } from "../everyday/EverydaySteps";
import type { StageContext } from "../staging/StageContext";

/**
 * The duel's actions on the stage: the on-guard stance, footwork relative to
 * the opponent, casting with its still aim and gesture, deflection, the
 * shield's formation and hold, the wrist grip and its underarm escape, the
 * run-in, the parry and the guided sideways evacuation, each timed by the
 * duel law and ending in a state relative to the opponent's placed state.
 *
 * ```ts
 * DuelSteps.time({ kind: "cast", spell: "jinx", at: { subject: "harry" } }, from, context, carina);
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md#stance Wand-side foot leading, feet 1.2-1.5 shoulder widths, wand tip at the opponent's chest.
 * @evidence docs/research/duelling/practice-duel.md#footwork Steps of 0.4 m in 0.4 s; circling keeps the chest square.
 * @evidence docs/research/duelling/practice-duel.md#casting Aim then gesture; contact at the gesture's end.
 * @evidence docs/research/duelling/practice-duel.md#grip Grip from the outside; underarm turn 0.8-1.2 s.
 * @evidence docs/research/duelling/practice-duel.md#run-in Run at 2-3 m/s.
 * @evidence docs/research/physics/falling-masonry.md#clearance Guided quick sideways steps of 0.6 m in 0.4 s.
 * @evidence docs/body/settings/cast/carina-malfoy.md#duelling Her shield forms in 0.25 s.
 * @evidence docs/body/settings/cast/harry-potter.md#duelling His shield forms in 0.4 s.
 * @evidence contracts/development/behaviors.md#studied-laws Every duration is the duel law's.
 * @evidence contracts/development/behaviors.md#relational-goals Footwork, aims and grips resolve against the opponent's placed state.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure functions of placed entries.
 * @evidence contracts/development/common.md#meaningful-documentation States what each action reads and ends in.
 */
export namespace DuelSteps {


  /** The timing of a duel action. */
  export function time(action: StageAction.Duel, from: IBodyState, context: StageContext, student: Student): EverydaySteps.ITime {
    switch (action.kind) {
      case "guard":
        return { duration: 0.5, move: { position: from.position, heading: BodyFrame.headingTo(from.position, context.point(action.at)) } };
      case "footwork": {
        const move = footwork(action, from, context);
        return { duration: action.steps * DuelLaw.STEP_TIME, move };
      }
      case "cast":
        return { duration: DuelLaw.AIM + DuelLaw.GESTURE + 0.15, contact: DuelLaw.AIM + DuelLaw.GESTURE, point: aim(action.at, action.aim ?? "body", context) };
      case "deflect": {
        // Without an absolute contact, the sweep lands when the latest streak cast at this defender arrives.
        const cast = context.find((e) => e.intent.capability === "cast" && (e.intent.parameters?.action as { at?: { subject?: string } } | undefined)?.at?.subject === student.id && e.contact !== undefined);
        const arrival: number | undefined = cast?.contact === undefined ? undefined : cast.contact + Math.max(0.3, Math.hypot(...((): [number, number] => { const p = (cast.state as { point?: { x: number; z: number } } | undefined)?.point; const q = from.position; return p ? [p.x - q.x, p.z - q.z] : [2, 0]; })()) / DuelLaw.SPELL_SPEED);
        const contact: number = action.contact === undefined && arrival !== undefined && arrival - context.time > DuelLaw.SWEEP ? arrival - context.time : DuelLaw.SWEEP;
        return { duration: contact + 0.33, contact, ...(action.toward === "floor" ? {} : { point: context.point(action.toward) }) };
      }
      case "shield": {
        const form: number = student.id === "carina" ? DuelLaw.SHIELD_FORM.fast : DuelLaw.SHIELD_FORM.slow;
        const hold: number = Math.min(DuelLaw.SHIELD_MAX, action.seconds);
        return { duration: DuelLaw.GESTURE + form + hold + DuelLaw.SHIELD_FADE, contact: DuelLaw.GESTURE + form };
      }
      case "grip":
        return { duration: DuelLaw.GRIP + 0.05, contact: DuelLaw.GRIP, point: aim({ subject: action.of }, action.part === "forearm" ? "forearm" : "wand-hand", context) };
      case "turnUnder":
        return { duration: DuelLaw.TURN_UNDER, contact: 0.9 * DuelLaw.TURN_UNDER };
      case "letGo":
        return { duration: 0.25, contact: 0.05 };
      case "run": {
        const target: IAutoMovieVector3 = context.point(action.to);
        const d: number = Math.hypot(target.x - from.position.x, target.z - from.position.z);
        // Grip range by default: 0.9 m between the two, an arm's length plus a forearm, so the bodies never meet.
        const stop: number = action.distance ?? 0.9;
        const run: number = Math.max(0, d - stop);
        const heading: number = BodyFrame.headingTo(from.position, target);
        const position: IAutoMovieVector3 = BodyFrame.toWorld(from.position, heading, { forward: run, left: 0, up: 0 });
        const speed: number = action.pace === "sprint" ? DuelLaw.RUN_SPRINT : DuelLaw.RUN_SPEED;
        return { duration: Math.max(0.6, run / speed + 0.2), contact: Math.max(0.6, run / speed + 0.2), move: { position: { ...position, y: 0 }, heading } };
      }
      case "parry":
        return { duration: 0.35, contact: 0.2 };
      case "guide": {
        const target: IAutoMovieVector3 = context.point(action.to);
        const heading: number = BodyFrame.headingTo(from.position, target);
        const pace = action.quick ? DuelLaw.GUIDE_QUICK : DuelLaw.GUIDE_STEP;
        const metres: number = Math.min(Math.hypot(target.x - from.position.x, target.z - from.position.z), action.steps * pace.length);
        const position: IAutoMovieVector3 = BodyFrame.toWorld(from.position, heading, { forward: metres, left: 0, up: 0 });
        return { duration: action.steps * pace.time, move: { position: { ...position, y: 0 }, heading: from.heading } };
      }
      case "wand":
        return { duration: 0.4 };
      case "levitate":
        return { duration: DuelLaw.AIM + 1.2, contact: DuelLaw.AIM + 0.6, point: context.point(action.to) };
    }
  }

  /** The state a duel action ends in. */
  export function end(action: StageAction.Duel, from: IBodyState, _context: StageContext, student: Student, t: EverydaySteps.ITime): IBodyState {
    const hands = { left: { ...from.hands.left }, right: { ...from.hands.right } };
    const next: IBodyState = { ...from, hands, bend: 0 };
    const m = student.measure;
    const wandPoint = (heading: number, position: IAutoMovieVector3): IAutoMovieVector3 =>
      BodyFrame.toWorld(position, heading, { forward: 0.45, left: -0.18, up: m.shoulder - 0.15 });
    switch (action.kind) {
      case "guard":
        hands.right = { ...hands.right, place: "extended", point: wandPoint(t.move!.heading, from.position) };
        hands.left = { ...hands.left, place: hands.left.holds === null ? "side" : hands.left.place, point: null };
        // On guard the eyes hold the opponent, and the stance squares to the opponent as it moves.
        return { ...next, stance: "guard", heading: t.move!.heading, gaze: "subject" in action.at ? { kind: "subject", subject: action.at.subject } : next.gaze };
      case "footwork":
      case "run":
      case "guide":
        if (hands.right.place === "extended") hands.right.point = wandPoint(t.move!.heading, t.move!.position);
        // The wand-drops habit: running at someone in danger, the wand tip comes down below his chest.
        if (action.kind === "run" && action.wand === "low") hands.right = { ...hands.right, place: "waist", point: null };
        return { ...next, position: t.move!.position, heading: t.move!.heading, stance: action.kind === "run" ? "relaxed" : from.stance };
      case "cast":
      case "deflect":
      case "turnUnder":
        if (hands.right.place === "extended") hands.right.point = wandPoint(from.heading, from.position);
        return next;
      case "shield":
        hands.right = { ...hands.right, place: "extended", point: wandPoint(from.heading, from.position) };
        return next;
      case "grip":
        hands.left = { place: "extended", point: t.point!, holds: null, follows: action.of };
        return next;
      case "letGo":
        hands.left = { place: "side", point: null, holds: null, follows: null };
        return next;
      case "parry":
        hands.left = { place: "side", point: null, holds: hands.left.holds };
        return next;
      case "wand": {
        const wand: string | null = hands.right.holds;
        if (action.to === "pocket") hands.right = { place: "side", point: null, holds: null };
        else if (action.to === "low") hands.right = { place: "waist", point: null, holds: wand };
        else hands.right = { place: "extended", point: wandPoint(from.heading, from.position), holds: wand ?? `wand-${student.id}` };
        return next;
      }
      case "levitate":
        return next;
    }
  }

  /** A point on the opponent to aim at: the wand hand, the wand shoulder, the forearm or the chest. */
  function aim(target: StageAction.Target, region: "wand-hand" | "wand-shoulder" | "body" | "forearm", context: StageContext): IAutoMovieVector3 {
    if (!("subject" in target) || !context.world.students.has(target.subject)) return context.point(target);
    const other: IBodyState = context.body(target.subject);
    const m = context.student(target.subject).measure;
    if ((region === "wand-hand" || region === "forearm") && other.hands.right.point !== null) {
      const p: IAutoMovieVector3 = other.hands.right.point;
      if (region === "wand-hand") return p;
      const back: IAutoMovieVector3 = BodyFrame.forward(BodyFrame.headingTo(p, other.position));
      return { x: p.x + back.x * 0.15, y: p.y - 0.03, z: p.z + back.z * 0.15 };
    }
    const up: number = region === "wand-shoulder" ? m.shoulder : m.shoulder - 0.25;
    return BodyFrame.toWorld(other.position, other.heading, { forward: 0.1, left: region === "wand-shoulder" ? -m.shoulderHalfWidth : 0, up });
  }

  /** Footwork's end relative to the faced opponent. */
  function footwork(
    action: Extract<StageAction.Action, { kind: "footwork" }>,
    from: IBodyState,
    context: StageContext,
  ): { position: IAutoMovieVector3; heading: number } {
    const target: IAutoMovieVector3 = context.point(action.facing);
    const metres: number = action.steps * DuelLaw.STEP;
    let position: IAutoMovieVector3;
    if (action.to !== undefined) {
      const goal: IAutoMovieVector3 = context.point(action.to);
      const d: number = Math.hypot(goal.x - from.position.x, goal.z - from.position.z);
      const k: number = d < 1e-6 ? 0 : Math.min(1, Math.max(metres, d) / d);
      position = { x: from.position.x + (goal.x - from.position.x) * k, y: 0, z: from.position.z + (goal.z - from.position.z) * k };
    } else if (action.move === "advance" || action.move === "retreat") {
      const toward: number = BodyFrame.headingTo(from.position, target);
      position = BodyFrame.toWorld(from.position, toward, { forward: action.move === "advance" ? metres : -metres, left: 0, up: 0 });
    } else {
      // Circle about the opponent by the arc the steps cover.
      const r: number = Math.max(0.5, Math.hypot(from.position.x - target.x, from.position.z - target.z));
      const around: number = BodyFrame.headingTo(target, from.position) + (action.move === "circleLeft" ? -1 : 1) * (metres / r);
      position = { x: target.x + Math.sin(around) * r, y: 0, z: target.z + Math.cos(around) * r };
    }
    return { position: { ...position, y: 0 }, heading: BodyFrame.headingTo(position, target) };
  }
}
