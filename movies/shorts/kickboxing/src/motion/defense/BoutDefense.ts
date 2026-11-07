import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutAnswer } from "../choreography/BoutAnswer";
import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { filmContactIntent } from "../contact/filmContactIntent";
import { FighterBody } from "../fighter/FighterBody";

/** Authored defensive intent only; impacts and recoil belong to the declared physical or kinematic response owner. */
export namespace BoutDefense {
  /** Receiver side facing the attacking limb. */
  export function struck(action: BoutScript.Action): "left" | "right" {
    return filmContactIntent(action).receiverSide;
  }
  /** Slip outside the punching arm. */
  export function slipDirection(action: BoutScript.Action): number {
    return struck(action) === "left" ? -1 : 1;
  }
  /** Authored shin-check reservation, film seconds. */
  export function checkWindow(
    action: BoutScript.Action,
  ): readonly [number, number] {
    return [action.at - 0.36, action.at + 0.44];
  }
  /** Check height envelope, independent of whether a blow lands. */
  export function checkAmount(
    action: BoutScript.Action,
    seconds: number,
  ): number {
    const [start, end]: readonly [number, number] = checkWindow(action);
    return Ease.plateau(seconds, start, action.at - 0.1, action.at + 0.1, end);
  }
  /** Apply anticipation, guard shape or evasion without adding any impact-driven offset. */
  export function apply(
    frame: FighterBody.Frame,
    action: BoutScript.Action,
    seconds: number,
  ): void {
    const at: number = action.at;
    if (seconds < at - 0.6 || seconds > at + 1.6) return;
    const side: "left" | "right" = struck(action);
    const toward: number = side === "left" ? 1 : -1;
    const protectedHands: FighterBody.Frame["hands"] | undefined =
      postWeight(frame.hands.left) > 0 || postWeight(frame.hands.right) > 0
        ? structuredClone(frame.hands)
        : undefined;
    try {
      switch (action.defense) {
        case "parry": {
          const amount: number = Ease.plateau(
            seconds,
            at - 0.2,
            at - 0.03,
            at + 0.06,
            at + 0.3,
          );
          FighterBody.assign(
            frame,
            side,
            { kind: "parry", action, amount },
            Ease.ramp(seconds, at - 0.2, at - 0.1),
          );
          frame.evade.lateral -= toward * 4 * amount;
          break;
        }
        case "cover": {
          const amount: number = Ease.plateau(
            seconds,
            at - 0.32,
            at - 0.1,
            at + 0.12,
            at + 0.42,
          );
          for (const hand of ["left", "right"] as const) {
            const current: FighterBody.Hand = frame.hands[hand];
            if (current.kind === "guard")
              current.tight = Math.max(current.tight, amount);
          }
          frame.drop += 0.025 * amount;
          frame.thoracic.flexion += 5 * amount;
          frame.cervical.flexion += 5 * amount;
          break;
        }
        case "catch":
        case "block": {
          const block: boolean = action.defense === "block";
          let amount: number = Ease.plateau(
            seconds,
            at - (block ? 0.42 : 0.32),
            at - 0.1,
            at + 0.14,
            at + (block ? 0.55 : 0.45),
          );
          if (
            action.actor === BoutScript.finish.actor &&
            BoutScript.finish.at - at < 1.5 &&
            seconds > at
          )
            amount =
              seconds < BoutScript.finish.at + 0.05
                ? 1
                : 1 -
                  Ease.ramp(
                    seconds,
                    BoutScript.finish.at + 0.05,
                    BoutScript.finish.at + 0.4,
                  );
          FighterBody.assign(
            frame,
            side,
            { kind: "catch", side, amount, low: block ? 0.4 : 1 },
            Ease.ramp(seconds, at - (block ? 0.42 : 0.32), at - 0.2),
          );
          if (
            action.actor === BoutScript.finish.actor &&
            BoutScript.finish.at - at < 1.5 &&
            seconds > at
          ) {
            frame.drop += 0.14 * amount;
            frame.thoracic.flexion += 16 * amount;
          }
          frame.drop += 0.03 * amount;
          frame.lumbar.lateral += toward * 5 * amount;
          break;
        }
        case "check": {
          const amount: number = checkAmount(action, seconds);
          frame.thoracic.flexion -= 3 * amount;
          frame.lumbar.lateral -= 5 * amount;
          frame.drop += 0.03 * amount;
          for (const hand of ["left", "right"] as const) {
            const current: FighterBody.Hand = frame.hands[hand];
            if (current.kind === "guard")
              current.tight = Math.max(current.tight, 0.5 * amount);
          }
          break;
        }
        case "slip": {
          const amount: number = Ease.pulse(
            seconds,
            at - 0.27,
            at - 0.03,
            at + 0.32,
          );
          const direction: number = slipDirection(action);
          frame.evade.lateral += 15 * direction * amount;
          frame.evade.shift += 0.075 * direction * amount;
          frame.evade.drop += 0.035 * amount;
          frame.turn -= 0.08 * direction * amount;
          break;
        }
        case "lean": {
          // A lean-back extends the trunk to its clinical extension limit at
          // the closest pass, the reach the outcome resolver measured.
          const answer: BoutAnswer.ISpec = BoutAnswer.get("lean");
          const amount: number = Ease.pulse(
            seconds,
            at - answer.lead,
            at,
            at + answer.recover + answer.lead,
          );
          frame.evade.flexion -= TRUNK_EXTENSION * amount;
          break;
        }
        case "none":
          break;
        case "weave": {
          const start: number = at - 0.32;
          const end: number = at + 0.4;
          if (seconds <= start || seconds >= end) break;
          const progress: number = (seconds - start) / (end - start);
          const amount: number = Math.sin(Math.PI * progress);
          const across: number =
            slipDirection(action) * Math.cos(Math.PI * progress);
          frame.evade.drop += 0.17 * amount;
          frame.evade.flexion += 22 * amount;
          frame.evade.lateral -= 14 * across * amount;
          frame.evade.shift -= 0.07 * across * amount;
          break;
        }
        case "hit": {
          if (
            action === BoutScript.finish ||
            BoutScript.specs[action.technique].target !== "head"
          )
            break;
          const current: FighterBody.Hand = frame.hands[side];
          if (
            seconds >= at + 0.5 ||
            (seconds > at &&
              (current.kind === "attack" ||
                (current.kind === "guard" && (current.extension ?? 0) > 0)))
          )
            break;
          FighterBody.assign(
            frame,
            side,
            {
              kind: "catch",
              side,
              amount: Ease.plateau(
                seconds,
                at - 0.28,
                at - 0.08,
                at + 0.08,
                at + 0.5,
              ),
              low: 1,
            },
            Ease.ramp(seconds, at - 0.3, at - 0.2) *
              (1 - Ease.ramp(seconds, at + 0.3, at + 0.5)),
          );
          break;
        }
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
  if (hand.kind === "blend")
    return (
      postWeight(hand.from) * (1 - hand.weight) +
      postWeight(hand.to) * hand.weight
    );
  return 0;
}

/** AAOS normal trunk extension, degrees; shared with the outcome geometry's backward evasion. */
const TRUNK_EXTENSION: number = 25;
