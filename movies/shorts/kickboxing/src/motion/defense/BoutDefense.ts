import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutAnswer } from "../choreography/BoutAnswer";
import { BoutOutcome } from "../choreography/BoutOutcome";
import { BoutTechnique } from "../choreography/BoutTechnique";
import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { filmContactIntent } from "../contact/filmContactIntent";
import { FighterBody } from "../fighter/FighterBody";

/**
 * The receiver's answer as performed intent. The family he chose shapes the
 * answer, the drawn start and the family's lead time it takes to set, and the
 * computed outcome how long he keeps it: a misread or late answer is still
 * performed (a block lowered for a body kick that never comes) and the blow
 * lands through it. Impacts and recoil belong to the declared physical or
 * kinematic response owner.
 */
export namespace BoutDefense {
  /** Receiver side facing the attacking limb. */
  export function struck(action: BoutScript.Action): "left" | "right" {
    return filmContactIntent(action).receiverSide;
  }

  /** Slip outside the punching arm. */
  export function slipDirection(action: BoutScript.Action): number {
    return struck(action) === "left" ? -1 : 1;
  }

  /**
   * Performed answer phases, film seconds: visible start, fully set, held
   * until and released by. The visible start never precedes the attacker's
   * launch or the family's own lead before contact, unless the receiver
   * committed earlier; any earlier drawn start is fully set by contact either
   * way, so the computed outcome is unchanged.
   */
  export function phases(action: BoutScript.Action): readonly [number, number, number, number] {
    const technique: BoutTechnique.ISpec = BoutTechnique.get(action.technique);
    const answer: BoutAnswer.ISpec = BoutAnswer.get(action.answer.family);
    const start: number = Math.max(action.parameters.begin, action.at - Math.max(technique.windup, answer.lead));
    const set: number = start + answer.lead;
    const worked: boolean = BoutOutcome.touches(action.outcome) && action.defense !== "hit";
    const held: number = Math.max(
      set,
      worked || action.outcome === "missed"
        ? action.at + BoutTechnique.HOLD
        : action.outcome === "bit"
          ? BoutOutcome.release(action.technique, action.answer, action.outcome, action.at, action.parameters.begin) - answer.recover
          : action.at,
    );
    return [start, set, held, held + Math.max(answer.lead, answer.recover)];
  }

  /** Performed answer weight in [0, 1]; zero for an ignored feint or no answer. */
  export function amount(action: BoutScript.Action, seconds: number): number {
    if (action.answer.family === "none" || action.outcome === "ignored") return 0;
    const [start, set, held, end]: readonly [number, number, number, number] = phases(action);
    return Ease.plateau(seconds, start, set, held, end);
  }

  /** Leg reservation of a shin check, film seconds. */
  export function checkWindow(action: BoutScript.Action): readonly [number, number] {
    const [start, , , end]: readonly [number, number, number, number] = phases(action);
    return [start, end];
  }

  /** Check height envelope, independent of whether a blow lands. */
  export function checkAmount(action: BoutScript.Action, seconds: number): number {
    return amount(action, seconds);
  }

  /** Apply the performed answer without adding any impact-driven offset. */
  export function apply(frame: FighterBody.Frame, action: BoutScript.Action, seconds: number): void {
    const k: number = amount(action, seconds);
    if (k <= 0) return;
    const side: "left" | "right" = struck(action);
    const toward: number = side === "left" ? 1 : -1;
    const [start, set]: readonly [number, number, number, number] = phases(action);
    const protectedHands: FighterBody.Frame["hands"] | undefined =
      postWeight(frame.hands.left) > 0 || postWeight(frame.hands.right) > 0 ? structuredClone(frame.hands) : undefined;
    // The region he believes is threatened shapes a block: forearm to the ribs
    // for a body read, glove pressed to the head for a head read.
    const read: BoutTechnique.ISpec = BoutTechnique.get(action.answer.reads ?? action.technique);
    try {
      switch (action.answer.family) {
        case "parry":
          FighterBody.assign(frame, side, { kind: "parry", action, amount: k }, Ease.ramp(seconds, start, set));
          frame.evade.lateral -= toward * 4 * k;
          break;
        case "cover":
          for (const hand of ["left", "right"] as const) {
            const current: FighterBody.Hand = frame.hands[hand];
            if (current.kind === "guard") current.tight = Math.max(current.tight, k);
          }
          frame.drop += 0.025 * k;
          frame.thoracic.flexion += 5 * k;
          frame.cervical.flexion += 5 * k;
          break;
        case "catch":
        case "block": {
          if (read.target === "head") {
            const current: FighterBody.Hand = frame.hands[side];
            if (current.kind === "guard") current.tight = Math.max(current.tight, k);
          } else
            FighterBody.assign(
              frame,
              side,
              { kind: "catch", side, amount: k, low: action.answer.family === "block" ? 1 : 0.6 },
              Ease.ramp(seconds, start, set),
            );
          frame.drop += 0.03 * k;
          frame.lumbar.lateral += toward * 5 * k;
          break;
        }
        case "check":
          frame.thoracic.flexion -= 3 * k;
          frame.lumbar.lateral -= 5 * k;
          frame.drop += 0.03 * k;
          for (const hand of ["left", "right"] as const) {
            const current: FighterBody.Hand = frame.hands[hand];
            if (current.kind === "guard") current.tight = Math.max(current.tight, 0.5 * k);
          }
          break;
        case "slip": {
          const direction: number = slipDirection(action);
          frame.evade.lateral += 15 * direction * k;
          frame.evade.shift += 0.075 * direction * k;
          frame.evade.drop += 0.035 * k;
          frame.turn -= 0.08 * direction * k;
          break;
        }
        case "lean":
          // A lean-back extends the trunk to its clinical extension limit at
          // the closest pass, the reach the outcome resolver measured.
          frame.evade.flexion -= TRUNK_EXTENSION * k;
          break;
        case "weave": {
          // The head travels under the arc and out on the far side.
          const [, , , end]: readonly [number, number, number, number] = phases(action);
          const across: number = slipDirection(action) * Math.cos(Math.PI * Ease.unit((seconds - start) / (end - start)));
          frame.evade.drop += 0.17 * k;
          frame.evade.flexion += 22 * k;
          frame.evade.lateral -= 14 * across * k;
          frame.evade.shift -= 0.07 * across * k;
          break;
        }
        case "none":
          break;
      }
    } finally {
      // Incoming anticipation may change the body while it kicks, but cannot
      // take either hand away from that kick's protective ownership.
      if (protectedHands) frame.hands = protectedHands;
    }
  }
}

/** An inactive branch of a handoff has no protective authority. */
function postWeight(hand: FighterBody.Hand): number {
  if (hand.kind === "guard") return hand.extension ?? 0;
  if (hand.kind === "blend") return postWeight(hand.from) * (1 - hand.weight) + postWeight(hand.to) * hand.weight;
  return 0;
}

/** AAOS normal trunk extension, degrees; shared with the outcome geometry's backward evasion. */
const TRUNK_EXTENSION: number = 25;
