import { Ease } from "../rig/Ease";
import { BoutScript } from "./BoutScript";
import { FighterBody } from "./FighterBody";

/**
 * The receiver's answer to one attack: defence, evasion or hit reaction.
 *
 * Sides follow two facing orthodox fighters: an attacker's left weapon arrives
 * at the receiver's right side and vice versa. A jab is parried by the right
 * glove and slipped to the receiver's right (outside the jab); a cross is
 * covered by the left glove and slipped to the left; body shots are caught by
 * the glove on the struck side.
 *
 * @evidence contracts/common.md#implementation-and-ownership Each answer is a smooth envelope around the attack's contact second, so the defence starts before contact and the recoil continues after it. Slips and weaves write only the frame's evasive fields, which lets the attacker aim at the head's nominal line. The knockout reaction belongs to the knockdown, not here.
 * @evidence contracts/common.md#authoring-interface Mutates the receiver's frame for film second t. Angles in degrees, distances in metres.
 */
export namespace Reaction {
  /**
   * Receiver side struck by an attack (mirror of the attacking side).
   *
   * @evidence contracts/common.md#implementation-and-ownership Mirror of the attacking side for two facing orthodox fighters.
   * @evidence contracts/common.md#authoring-interface Returns the receiver's own side.
   */
  export function struck(action: BoutScript.Action): "left" | "right" {
    return BoutScript.specs[action.technique].side === "left"
      ? "right"
      : "left";
  }

  /**
   * Receiver's lateral evasion direction: +1 to its left, −1 to its right.
   *
   * @evidence contracts/common.md#implementation-and-ownership Slip outside the punching arm, away from the struck side.
   * @evidence contracts/common.md#authoring-interface +1 is the receiver's left, −1 its right.
   */
  export function slipDirection(action: BoutScript.Action): number {
    // Slip outside the punching arm: away from the struck side.
    return struck(action) === "left" ? -1 : 1;
  }

  /**
   * Reservation of the lead leg for a shin check.
   *
   * @evidence contracts/common.md#implementation-and-ownership Fixed window around contact that also reserves the lead leg in the footstep schedule.
   * @evidence contracts/common.md#authoring-interface Film seconds [start, end].
   */
  export function checkWindow(
    action: BoutScript.Action,
  ): readonly [number, number] {
    return [action.at - 0.36, action.at + 0.44];
  }

  /**
   * Lift of the checking leg in [0, 1].
   *
   * @evidence contracts/common.md#implementation-and-ownership Plateau envelope inside the check window.
   * @evidence contracts/common.md#authoring-interface Unit lift of the checking leg.
   */
  export function checkAmount(action: BoutScript.Action, t: number): number {
    const [start, end] = checkWindow(action);
    return Ease.plateau(t, start, action.at - 0.1, action.at + 0.1, end);
  }

  /**
   * Apply one answer to the receiver's frame.
   *
   * @evidence contracts/common.md#implementation-and-ownership Adds the answer's envelope around the contact second: hands for parry, cover, catch and block; evasive fields for slips and weaves; trunk fold and recoil for hits.
   * @evidence contracts/common.md#authoring-interface Mutates the receiver's frame; ignores actions more than 0.6 s before or 1.6 s after contact. `strength` in [0, 1] is the measured contact of this action (1 until measured); recoil and hit reactions scale with it while the defensive shape does not.
   */
  export function apply(
    frame: FighterBody.Frame,
    action: BoutScript.Action,
    t: number,
    strength: number = 1,
  ): void {
    const at: number = action.at;
    if (t < at - 0.6 || t > at + 1.6) return;
    const side: "left" | "right" = struck(action);
    const toward: number = side === "left" ? 1 : -1;

    // Impact-driven motion scales with the measured contact: no recoil from a blow that did not land.
    const recoil: number = Ease.pulse(t, at, at + 0.08, at + 0.38) * strength;
    switch (action.defense) {
      case "parry": {
        const k: number = Ease.plateau(
          t,
          at - 0.2,
          at - 0.03,
          at + 0.06,
          at + 0.3,
        );
        FighterBody.assign(
          frame,
          side,
          { kind: "parry", action, amount: k },
          Ease.ramp(t, at - 0.2, at - 0.1),
        );
        frame.evade.lateral += -toward * 4 * k;
        break;
      }
      case "cover": {
        const k: number = Ease.plateau(
          t,
          at - 0.32,
          at - 0.1,
          at + 0.12,
          at + 0.42,
        );
        for (const hand of ["left", "right"] as const) {
          const current: FighterBody.Hand = frame.hands[hand];
          if (current.kind === "guard")
            current.tight = Math.max(current.tight, k);
        }
        frame.drop += 0.025 * k;
        frame.thoracic.flexion += 5 * k;
        frame.cervical.flexion += 5 * k;
        frame.shift[0] -= 0.06 * recoil;
        frame.thoracic.rotation += -toward * 8 * recoil;
        frame.cervical.flexion -= 6 * recoil;
        frame.evade.lateral += -toward * 4 * recoil;
        break;
      }
      case "catch":
      case "block": {
        const block: boolean = action.defense === "block";
        let k: number = Ease.plateau(
          t,
          at - (block ? 0.42 : 0.32),
          at - 0.1,
          at + 0.14,
          at + (block ? 0.55 : 0.45),
        );
        // Before the finish the receiver's guard stays low after the last body hook.
        const finish: BoutScript.Action = BoutScript.finish;
        if (action.actor === finish.actor && finish.at - at < 1.5 && t > at)
          k =
            t < finish.at + 0.05
              ? 1
              : 1 - Ease.ramp(t, finish.at + 0.05, finish.at + 0.4);
        FighterBody.assign(
          frame,
          side,
          { kind: "catch", side, amount: k, low: block ? 0.4 : 1 },
          Ease.ramp(t, at - (block ? 0.42 : 0.32), at - 0.2),
        );
        if (action.actor === finish.actor && finish.at - at < 1.5 && t > at) {
          frame.drop += 0.14 * k;
          frame.thoracic.flexion += 16 * k;
        }
        frame.drop += 0.03 * k;
        frame.lumbar.lateral += toward * 5 * k;
        frame.shift[0] -= (block ? 0.06 : 0.03) * recoil;
        break;
      }
      case "check": {
        const k: number = checkAmount(action, t);
        frame.thoracic.flexion -= 3 * k;
        frame.lumbar.lateral -= 5 * k;
        frame.drop += 0.03 * k;
        for (const hand of ["left", "right"] as const) {
          const current: FighterBody.Hand = frame.hands[hand];
          if (current.kind === "guard")
            current.tight = Math.max(current.tight, 0.5 * k);
        }
        break;
      }
      case "slip": {
        const k: number = Ease.pulse(t, at - 0.27, at - 0.03, at + 0.32);
        const direction: number = slipDirection(action);
        frame.evade.lateral += 15 * direction * k;
        frame.evade.shift += 0.075 * direction * k;
        frame.evade.drop += 0.035 * k;
        frame.turn += -0.08 * direction * k;
        break;
      }
      case "weave": {
        const start: number = at - 0.32;
        const end: number = at + 0.4;
        if (t <= start || t >= end) break;
        const u: number = (t - start) / (end - start);
        const k: number = Math.sin(Math.PI * u);
        const across: number = slipDirection(action) * Math.cos(Math.PI * u);
        frame.evade.drop += 0.17 * k;
        frame.evade.flexion += 22 * k;
        frame.evade.lateral += -14 * across * k;
        frame.evade.shift += -0.07 * across * k;
        break;
      }
      case "hit": {
        if (action.technique === "high-kick") break;
        const heavy: boolean = action.technique === "body-kick";
        const k: number =
          Ease.pulse(t, at - 0.01, at + 0.09, at + (heavy ? 0.85 : 0.6)) *
          strength;
        frame.thoracic.flexion += (heavy ? 22 : 17) * k;
        frame.lumbar.flexion += 9 * k;
        frame.lumbar.lateral += toward * 11 * k;
        frame.drop += (heavy ? 0.09 : 0.065) * k;
        frame.shift[0] -= (heavy ? 0.14 : 0.09) * k;
        frame.turn += toward * 0.12 * k;
        frame.jaw = Math.max(frame.jaw, 16 * k);
        FighterBody.assign(
          frame,
          side,
          {
            kind: "catch",
            side,
            amount:
              0.8 *
              Ease.ramp(t, at + 0.02, at + 0.15) *
              (1 - Ease.ramp(t, at + 0.45, at + 0.9)),
            low: 0.8,
          },
          Ease.ramp(t, at, at + 0.1),
        );
        break;
      }
    }
  }
}
