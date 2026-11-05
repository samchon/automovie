import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import type { FighterBody } from "../fighter/FighterBody";
import { Ease } from "../rig/Ease";

/**
 * The live rhythm of a fighter between and around scripted exchanges.
 *
 * Fighters never wait in a shared idle pose (screenplay, 0–15 s): they bounce
 * on the balls of their feet, rock in and out of range with small steps and
 * sway. About every 0.9 s each fighter also does one habit: an offensive feint
 * (jab, shoulder, level change, step-in or kick twitch) or an unprompted
 * defensive move (pre-emptive slip, short weave, shelling up, head bob). An
 * offensive feint draws a flinch from the opponent 0.08 s later. Everything
 * fades out while the fighter attacks or answers an attack, so scripted
 * exchanges keep their exact ranges and contacts.
 *
 * @evidence contracts/common.md#implementation-and-ownership Deterministic: incommensurate sines and a hashed habit schedule over fixed slots, closed-form in film time, so seek, playback and export agree. Stance offsets feed the footstep generator, which turns them into supported steps; slips and weaves write the frame's evasive fields like scripted evasions.
 * @evidence contracts/common.md#authoring-interface Film seconds; metres; degrees. `idle` is 1 away from exchanges and 0 inside them.
 */
export namespace Rhythm {
  /**
   * Habit kinds; the first five are offensive feints the opponent can read.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed menu weighted roughly half feints, half defensive habits.
   * @evidence contracts/common.md#authoring-interface The first five are feints the opponent flinches at.
   */
  export type Habit =
    | "jab-feint"
    | "shoulder-feint"
    | "level-feint"
    | "step-feint"
    | "kick-feint"
    | "slip"
    | "weave"
    | "shell"
    | "bob";

  /** Menu with weights (feints and defensive habits roughly equally). */
  const MENU: readonly (readonly [Habit, number])[] = [
    ["jab-feint", 3],
    ["shoulder-feint", 2],
    ["level-feint", 2],
    ["step-feint", 1.5],
    ["kick-feint", 1.5],
    ["slip", 3],
    ["weave", 1.5],
    ["shell", 2],
    ["bob", 2],
  ];

  /** Habit slot length, seconds. */
  const SLOT: number = 0.9;

  /**
   * 0 inside a scripted exchange involving this fighter, 1 well away from one.
   *
   * @evidence contracts/common.md#implementation-and-ownership One minus the strongest plateau of any nearby exchange involving this fighter, ramped in after the opening and zero before the finish.
   * @evidence contracts/common.md#authoring-interface Unit idleness at a film second.
   */
  export function idle(id: BoutScript.Fighter, t: number): number {
    if (t >= BoutScript.finish.at - 1.6) return 0;
    let busy: number = 0;
    for (const action of BoutScript.actions) {
      if (action.at < t - 1.2 || action.at > t + 1.4) continue;
      const spec = BoutScript.specs[action.technique];
      const before: number = action.actor === id ? spec.windup + 0.55 : 0.5;
      busy = Math.max(
        busy,
        Ease.plateau(
          t,
          action.at - before - 0.3,
          action.at - before,
          action.at + spec.recovery,
          action.at + spec.recovery + 0.35,
        ),
      );
    }
    return (1 - busy) * Ease.ramp(t, 1.6, 2.2);
  }

  /**
   * The habit of the slot containing t, its side (+1 left, −1 right) and its envelope.
   *
   * @evidence contracts/common.md#implementation-and-ownership Hashed choice per fixed 0.9 s slot with a hashed start and side; pure.
   * @evidence contracts/common.md#authoring-interface Returns the habit, side and pulse envelope at a film second.
   */
  export function habit(
    id: BoutScript.Fighter,
    t: number,
  ): { kind: Habit; side: number; k: number; peak: number } {
    const offset: number = id === "a" ? 0 : 0.43;
    const index: number = Math.floor((t + offset) / SLOT);
    const h1: number = hash(index, id === "a" ? 1 : 7);
    const h2: number = hash(index, id === "a" ? 3 : 11);
    const total: number = MENU.reduce(
      (sum: number, [, w]: readonly [Habit, number]): number => sum + w,
      0,
    );
    let pick: number = h1 * total;
    let kind: Habit = MENU[0]![0];
    for (const [name, weight] of MENU) {
      if (pick < weight) {
        kind = name;
        break;
      }
      pick -= weight;
    }
    const start: number = index * SLOT - offset + 0.1 + 0.35 * h2;
    const length: number =
      kind === "weave" ? 0.5 : kind === "shell" ? 0.55 : 0.36;
    const peak: number = start + length * 0.4;
    return {
      kind,
      side: h2 < 0.5 ? 1 : -1,
      k: Ease.pulse(t, start, peak, start + length),
      peak,
    };
  }

  /**
   * Stance rocking [forward, left] in metres, scaled by idleness.
   *
   * @evidence contracts/common.md#implementation-and-ownership Two incommensurate sines per axis plus a step-feint push, scaled by idleness.
   * @evidence contracts/common.md#authoring-interface [forward, left] metres in the heading frame.
   */
  export function stance(
    id: BoutScript.Fighter,
    t: number,
  ): readonly [number, number] {
    const p: number = id === "a" ? 0 : 2.3;
    const w: number = idle(id, t);
    let forward: number =
      0.07 * Math.sin(2 * Math.PI * 0.62 * t + p) +
      0.04 * Math.sin(2 * Math.PI * 0.27 * t + 1.7 * p);
    const left: number =
      0.06 * Math.sin(2 * Math.PI * 0.21 * t + 0.6 + p) +
      0.03 * Math.sin(2 * Math.PI * 0.47 * t + p);
    const own = habit(id, t);
    if (own.kind === "step-feint") forward += 0.09 * own.k;
    return [forward * w, left * w];
  }

  /**
   * Add bounce, sway, habits and flinches to a fighter's frame.
   *
   * @evidence contracts/common.md#implementation-and-ownership Adds bounce, sway, the own habit and a flinch to the opponent's feint 0.08 s later, all scaled by idleness.
   * @evidence contracts/common.md#authoring-interface Mutates the fighter's frame at a film second.
   */
  export function apply(
    frame: FighterBody.Frame,
    id: BoutScript.Fighter,
    t: number,
  ): void {
    const p: number = id === "a" ? 0 : 2.3;
    const w: number = idle(id, t);

    // Bounce on the balls of the feet, a little even inside exchanges.
    frame.drop +=
      0.016 *
      (0.5 + 0.5 * Math.sin(2 * Math.PI * 2.05 * t + p)) *
      (0.35 + 0.65 * w);

    // Head and shoulder sway.
    frame.thoracic.lateral +=
      (3.5 * Math.sin(2 * Math.PI * 0.53 * t + p) +
        1.5 * Math.sin(2 * Math.PI * 1.31 * t)) *
      w;
    frame.thoracic.rotation +=
      5 * Math.sin(2 * Math.PI * 0.77 * t + 0.4 * p) * w;
    frame.cervical.lateral -= 2 * Math.sin(2 * Math.PI * 0.53 * t + p) * w;
    frame.turn += 0.05 * Math.sin(2 * Math.PI * 0.41 * t + p) * w;

    // Own habit.
    const own = habit(id, t);
    perform(frame, own.kind, own.side, own.k * w);

    // Flinch at the opponent's offensive feint, 0.08 s after its peak.
    const other = habit(id === "a" ? "b" : "a", t - 0.08);
    if (other.k > 0 && FEINTS.has(other.kind)) {
      const flinch: number =
        other.k * 0.65 * w * Math.min(1, idle(id === "a" ? "b" : "a", t) * 1.5);
      if (other.kind === "level-feint" || other.kind === "kick-feint")
        perform(frame, "shell", 1, flinch);
      else
        perform(frame, other.side > 0 ? "slip" : "shell", -other.side, flinch);
    }
  }

  /** Offensive feints the opponent reads. */
  const FEINTS: ReadonlySet<Habit> = new Set<Habit>([
    "jab-feint",
    "shoulder-feint",
    "level-feint",
    "step-feint",
    "kick-feint",
  ]);

  /** Write one habit at weight k. */
  function perform(
    frame: FighterBody.Frame,
    kind: Habit,
    side: number,
    k: number,
  ): void {
    if (k <= 0) return;
    switch (kind) {
      case "jab-feint": {
        const hand: FighterBody.Hand = frame.hands.left;
        if (hand.kind === "guard")
          hand.reach = Math.max(hand.reach ?? 0, 0.17 * k);
        frame.girdle.left.protraction += 9 * k;
        frame.turn += 0.07 * k;
        frame.shift[0] += 0.03 * k;
        break;
      }
      case "shoulder-feint":
        frame.thoracic.rotation += 12 * k;
        frame.turn -= 0.12 * k;
        frame.girdle.right.protraction += 10 * k;
        frame.drop += 0.025 * k;
        break;
      case "level-feint":
        frame.drop += 0.08 * k;
        frame.thoracic.flexion += 9 * k;
        frame.shift[0] += 0.03 * k;
        break;
      case "step-feint":
        frame.girdle.left.protraction += 5 * k;
        frame.thoracic.flexion += 4 * k;
        break;
      case "kick-feint":
        frame.turn -= 0.22 * k;
        frame.pelvis.obliquity -= 6 * k;
        frame.drop += 0.03 * k;
        break;
      case "slip":
        frame.evade.lateral += 11 * side * k;
        frame.evade.shift += 0.055 * side * k;
        frame.evade.drop += 0.025 * k;
        break;
      case "weave":
        frame.evade.drop += 0.1 * k;
        frame.evade.flexion += 13 * k;
        frame.evade.lateral += 9 * side * Math.sin(Math.PI * k);
        break;
      case "shell":
        for (const hand of ["left", "right"] as const) {
          const current: FighterBody.Hand = frame.hands[hand];
          if (current.kind === "guard")
            current.tight = Math.max(current.tight, k);
        }
        frame.cervical.flexion += 6 * k;
        frame.drop += 0.02 * k;
        break;
      case "bob":
        frame.evade.drop += 0.045 * k;
        frame.evade.flexion += 5 * k;
        break;
    }
  }
}

/** Deterministic hash of an integer slot in [0, 1). */
function hash(index: number, salt: number): number {
  const value: number = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
