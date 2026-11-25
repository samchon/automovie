import type { IAutoMovieComposition, IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import {
  composeHumanAdjustCuff,
  composeHumanStraightenPartnerTie,
  composeHumanStraightenTie,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The dressing touches compose one `touch` each: adjusting a cuff squeezes the
 * cuff's wrist with the other hand's fingertips for 0.2 s; straightening one's
 * own tie rubs the sternum once upward with the fingertips; straightening a
 * partner's rubs the partner's sternum once upward with the palm.
 *
 * Scenarios, on a chain for subject `a`:
 *
 * 1. Adjusting the left cuff touches the left wrist with the right hand.
 * 2. Straightening the tie with the right hand rubs the own sternum.
 * 3. Straightening `b`'s tie with the left hand rubs `b`'s sternum.
 */
export function test_motions_dressing_compose_touches(): void {
  const intent: (node: IAutoMovieComposition) => IAutoMovieIntent = (
    node: IAutoMovieComposition,
  ): IAutoMovieIntent => {
    if (node.kind === "intent") return node.intent;
    if (node.kind === "sequence" || node.kind === "parallel")
      return intent(node.parts[node.parts.length - 1]!);
    throw new Error(`An anchored node carries no intent of its own`);
  };
  const cuff: IAutoMovieIntent = intent(
    composeHumanAdjustCuff(HumanChain.subject("a"), { cuff: "left" }).node,
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
    composeHumanStraightenTie(HumanChain.subject("a"), "right").node,
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
    composeHumanStraightenPartnerTie(HumanChain.subject("a"), {
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
