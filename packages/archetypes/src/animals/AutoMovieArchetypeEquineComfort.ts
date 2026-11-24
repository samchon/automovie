import { seededValue } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeEquineComfortCue } from "./AutoMovieArchetypeEquineComfortCue";
import { AutoMovieArchetypeEquineExpression } from "./AutoMovieArchetypeEquineExpression";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import { AutoMovieArchetypeEquineStance } from "./AutoMovieArchetypeEquineStance";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/** An idle act's kind. */
type IdleKind = Exclude<
  AutoMovieArchetypeEquineComfortCue.Act["kind"],
  AutoMovieArchetypeEquineComfortCue.Elimination
>;

/** Seconds bounds of an idle act or gap. */
type Bounds = readonly [number, number];

/** Each idle act's length bounds, seconds: authored. */
const IDLE: Readonly<Record<IdleKind, Bounds>> = {
  rest: [8, 14],
  doze: [6, 10],
  swish: [1.5, 3],
  twitch: [0.5, 1],
  paw: [2, 3.5],
  stamp: [0.6, 0.9],
  shake: [1.5, 2.5],
  cowKick: [0.8, 1.2],
  yawn: [2.5, 4],
  flehmen: [3, 5],
};

/** The idle kinds in a fixed order, so a seed picks the same one every time. */
const KINDS: readonly IdleKind[] = [
  "rest",
  "doze",
  "swish",
  "twitch",
  "paw",
  "stamp",
  "shake",
  "cowKick",
  "yawn",
  "flehmen",
];

/** The neutral gap between idle acts, seconds: authored. */
const GAP: Bounds = [1, 3];

/** The twitch regions in a fixed order. */
const REGIONS: readonly AutoMovieArchetypeEquineExpressionCue.Region[] = [
  "neck",
  "shoulder",
  "barrel",
  "flank",
  "croup",
];

/** The limbs in a fixed order. */
const LIMBS: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
  "leftFore",
  "rightFore",
  "leftHind",
  "rightHind",
];

/**
 * The standing horse's rest, comfort and elimination behaviours over a halt,
 * and seeded idle cycles of them.
 *
 * Each act expands into stance rows (`EquineComfortRows` through
 * `AutoMovieArchetypeEquineStance`) and expression cues
 * (`AutoMovieArchetypeEquineExpression`), both ending in the neutral halt by
 * the act's end: a standing rest rests a hind hoof on its toe; a doze lowers
 * the neck toward horizontal, droops both ears sideways and slackens the lower
 * lip; the flehmen raises the head and curls the upper lip; a yawn stretches
 * the head and opens the jaw wide; a shake rolls the neck first and the trunk
 * after it, the hooves planted; pawing, stamping and the cow-kick are their
 * stance rows; a swish swings the tail; a skin twitch is a named mark;
 * urination camps out with the tail raised and defecation lifts the tail. Each
 * act's phase split is authored. An idle cycle lays acts one after another from
 * a seed, each kind's length and every neutral gap drawn within authored bounds
 * and the rest's side alternating, so a seed always gives the same cycle and
 * every act returns to neutral before the next.
 */
export namespace AutoMovieArchetypeEquineComfort {
  /**
   * Play acts over a horse's ride after it halts.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Its ride, halted where the acts start.
   * @param acts The acts, not overlapping.
   * @returns The ride with the acts layered over its halt.
   * @throws {AutoMovieArchetypeRefusal} For an act asked for while the horse is
   *   moving, a window that is not finite and positive, pawing with a stroke
   *   count that is not a positive whole number, overlapping acts, or anything
   *   the stance or the expression layer refuses.
   */
  export function after<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    acts: readonly AutoMovieArchetypeEquineComfortCue.Act[],
  ): AutoMovieArchetypeEquineExpression.IRide<Id, D> {
    const refuse = (axis: string, value: unknown, reason: string): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis,
        value,
        feasible: null,
        reason,
        fix: "Ask for comfort acts once the horse has halted, each over a finite positive window, one after another.",
      });
    };
    const rows: AutoMovieArchetypeEquineStanceCue.Cue[] = [];
    const cues: AutoMovieArchetypeEquineExpressionCue.Cue[] = [];
    let last: number = -Infinity;
    for (const act of [...acts].sort(
      (
        p: AutoMovieArchetypeEquineComfortCue.Act,
        q: AutoMovieArchetypeEquineComfortCue.Act,
      ): number => p.from - q.from,
    )) {
      if (!(act.seconds > 0))
        refuse("seconds", act.seconds, `a ${act.kind} needs a positive window`);
      if (act.from < last)
        refuse("from", act.from, `the ${act.kind} overlaps the act before it`);
      if (act.from < ride.duration && ride.plan.at(act.from).speed > 0)
        refuse(
          "from",
          act.from,
          `the ${act.kind} is asked for while the horse is moving`,
        );
      if (act.kind === "paw" && !(act.strokes > 0))
        refuse(
          "strokes",
          act.strokes,
          "pawing takes a positive whole number of strokes",
        );
      expand(act, rows, cues);
      last = act.from + act.seconds;
    }
    return AutoMovieArchetypeEquineExpression.layer(
      animal,
      AutoMovieArchetypeEquineStance.after(animal, ride, rows),
      cues,
    );
  }

  /**
   * A seeded idle cycle of comfort acts.
   *
   * @param seed The seed; the same seed gives the same cycle.
   * @param from Film second the cycle starts, the horse halted.
   * @param to Film second by which every act has returned to neutral.
   * @returns The acts, one after another.
   */
  export function idle(
    seed: number,
    from: number,
    to: number,
  ): AutoMovieArchetypeEquineComfortCue.Act[] {
    const acts: AutoMovieArchetypeEquineComfortCue.Act[] = [];
    const draw = (slot: number, domain: number): number =>
      seededValue(seed, slot, domain);
    const within = (bounds: Bounds, value: number): number =>
      bounds[0] + (bounds[1] - bounds[0]) * value;
    let side: AutoMovieArchetypeEquineExpressionCue.Side =
      draw(0, 0) < 0.5 ? "left" : "right";
    let at: number = from;
    for (let slot: number = 1; ; slot++) {
      const start: number = at + within(GAP, draw(slot, 1));
      const kind: IdleKind = KINDS[Math.floor(draw(slot, 2) * KINDS.length)]!;
      const seconds: number = within(IDLE[kind], draw(slot, 3));
      if (start + seconds > to) return acts;
      const pick: number = draw(slot, 4);
      const window: AutoMovieArchetypeEquineComfortCue.IWindow = {
        from: start,
        seconds,
      };
      if (kind === "rest") {
        acts.push({ kind, side, ...window });
        side = side === "left" ? "right" : "left";
      } else if (kind === "paw")
        acts.push({
          kind,
          side: pick < 0.5 ? "left" : "right",
          strokes: 2 + Math.floor(pick * 3),
          ...window,
        });
      else if (kind === "stamp")
        acts.push({
          kind,
          limb: LIMBS[Math.floor(pick * LIMBS.length)]!,
          ...window,
        });
      else if (kind === "cowKick")
        acts.push({ kind, side: pick < 0.5 ? "left" : "right", ...window });
      else if (kind === "twitch")
        acts.push({
          kind,
          region: REGIONS[Math.floor(pick * REGIONS.length)]!,
          ...window,
        });
      else acts.push({ kind, ...window });
      at = start + seconds;
    }
  }

  /** Expand one act into stance rows and expression cues. */
  function expand(
    act: AutoMovieArchetypeEquineComfortCue.Act,
    rows: AutoMovieArchetypeEquineStanceCue.Cue[],
    cues: AutoMovieArchetypeEquineExpressionCue.Cue[],
  ): void {
    const s: number = act.seconds;
    const phases = (
      entry: number,
      hold: number,
      exit: number,
      delay: number = 0,
    ): AutoMovieArchetypeEquineStanceCue.IPhases => ({
      from: act.from + delay * s,
      entry: entry * s,
      hold: hold * s,
      exit: exit * s,
    });
    const window = (
      ease: number,
      from: number = 0,
      to: number = 1,
    ): AutoMovieArchetypeEquineExpressionCue.IWindow => ({
      from: act.from + from * s,
      to: act.from + to * s,
      ease: Math.min(ease, ((to - from) * s) / 4),
    });
    if (act.kind === "rest")
      rows.push({ kind: "rest", side: act.side, ...phases(0.15, 0.7, 0.15) });
    else if (act.kind === "paw")
      rows.push({
        kind: "paw",
        side: act.side,
        strokes: act.strokes,
        ...phases(0.2, 0.6, 0.2),
      });
    else if (act.kind === "stamp")
      rows.push({ kind: "stamp", limb: act.limb, ...phases(0.55, 0.15, 0.3) });
    else if (act.kind === "cowKick")
      rows.push({ kind: "cowKick", side: act.side, ...phases(0.4, 0.2, 0.4) });
    else if (act.kind === "shake") {
      cues.push({ kind: "shake", ...window(0.15 * s, 0, 0.6) });
      rows.push({ kind: "shake", ...phases(0.05, 0.65, 0.1, 0.2) });
    } else if (act.kind === "doze") {
      cues.push({ kind: "carriage", carriage: "doze", ...window(1.5) });
      cues.push({ kind: "ear", side: "left", carriage: "droop", ...window(1) });
      cues.push({
        kind: "ear",
        side: "right",
        carriage: "droop",
        ...window(1),
      });
      cues.push({ kind: "lip", action: "slack", ...window(1) });
    } else if (act.kind === "flehmen") {
      cues.push({ kind: "carriage", carriage: "flehmen", ...window(0.6) });
      cues.push({ kind: "lip", action: "curl", ...window(0.5, 0.1, 0.9) });
    } else if (act.kind === "yawn") {
      cues.push({ kind: "carriage", carriage: "yawn", ...window(0.5) });
      cues.push({ kind: "jaw", action: "yawn", ...window(0.5, 0.1, 0.9) });
    } else if (act.kind === "swish")
      cues.push({ kind: "tail", carriage: "swish", ...window(0.3) });
    else if (act.kind === "twitch")
      cues.push({ kind: "twitch", region: act.region, at: act.from });
    else if (act.kind === "urinate") {
      rows.push({ kind: "camp", ...phases(0.25, 0.5, 0.25) });
      cues.push({
        kind: "tail",
        carriage: "raised",
        ...window(0.1 * s, 0.2, 0.8),
      });
    } else cues.push({ kind: "tail", carriage: "raised", ...window(0.5) });
  }
}
