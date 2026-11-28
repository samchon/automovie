import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain } from "@automovie/motions";
import {
  composeHumanAdjustCuff
} from "../../../../../packages/motions/src/dressing/internal/composeHumanAdjustCuff";
import {
  composeHumanStraightenPartnerTie
} from "../../../../../packages/motions/src/dressing/internal/composeHumanStraightenPartnerTie";
import {
  composeHumanStraightenTie
} from "../../../../../packages/motions/src/dressing/internal/composeHumanStraightenTie";
import { TestValidator } from "@nestia/e2e";

/**
 * Check which touch each cuff and tie composer appends.
 *
 * Scenarios:
 *
 * 1. Adjust the left cuff with the right fingertips on the left wrist for a
 *    0.2 s squeeze.
 * 2. Use fingertips to rub one's own sternum upward when straightening a tie.
 *    Use the left palm on partner `b` 's sternum for a partner's tie.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify subject, hand, surface, motion and cuff hold duration.
 * @evidence contracts/development/testing.md#behavioral-verification The helper calls each append one touch, and the test inspects the complete appended request.
 * @evidence contracts/development/testing.md#independent-expectations Each expected intent is written from the declared subject and hand and the composer-specific touch settings.
 */
export function test_motions_dressing_compose_touches(): void {
  const intent: (node: IAutoMovieComposition) => IAutoMovieIntent = (
    node: IAutoMovieComposition,
  ): IAutoMovieIntent => {
    if (node.type === "intent") return node.intent;
    if (node.type === "sequence" || node.type === "parallel")
      return intent(node.parts[node.parts.length - 1]!);
    throw new Error(`An anchored node carries no intent of its own`);
  };
  const cuff: IAutoMovieIntent = intent(
    composeHumanAdjustCuff(AutoMovieMotionHumanChain.subject("a"), { cuff: "left" }).node,
  );
  TestValidator.equals(
    "the cuff",
    [cuff.subject, cuff.capability, cuff.parameters?.params],
    [
      "a",
      "touch",
      {
        target: { kind: "self", region: "wristLeft" },
        hand: "right",
        kind: "squeeze",
        effector: "fingertips",
        hold: 0.2,
      },
    ],
  );
  const own: IAutoMovieIntent = intent(
    composeHumanStraightenTie(AutoMovieMotionHumanChain.subject("a"), "right").node,
  );
  TestValidator.equals(
    "the own tie",
    [own.capability, own.parameters?.params],
    [
      "touch",
      {
        target: { kind: "self", region: "sternum" },
        hand: "right",
        kind: "rub",
        effector: "fingertips",
        tangent: "up",
        count: 1,
        hold: 0,
      },
    ],
  );
  const partner: IAutoMovieIntent = intent(
    composeHumanStraightenPartnerTie(AutoMovieMotionHumanChain.subject("a"), {
      partner: "b",
      side: "left",
    }).node,
  );
  TestValidator.equals(
    "the partner's tie",
    [partner.capability, partner.parameters?.params],
    [
      "touch",
      {
        target: { kind: "person", subject: "b", region: "sternum" },
        hand: "left",
        kind: "rub",
        effector: "palm",
        tangent: "up",
        count: 1,
        hold: 0,
      },
    ],
  );
}
