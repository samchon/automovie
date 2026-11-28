import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain } from "@automovie/motions";
import {
  HumanPocket
} from "../../../../../packages/motions/src/handling/internal/HumanPocket";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPocket.takeOut` appends a pick-up of the stowed prop by its handle into
 * the named hand, lifted nothing: the hand leaves the pocket as it closes.
 *
 * Scenario, on a chain for subject `a`: taking `phone` out by `grip` with the
 * right hand appends that `pickUp`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines authored chain expansion to pick up the carried pocket prop by its named site with no lift.
 * @evidence contracts/development/testing.md#behavioral-verification Builds one `takeOut` action on subject a using a phone, grip and right hand and inspects the appended action.
 * @evidence contracts/development/testing.md#independent-expectations The fixture supplies phone, grip and right side explicitly. They must be transferred to the resulting pickup with its zero lift.
 */
export function test_motions_handling_human_pocket_take_out(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.type === "intent") return node.intent;
    if (node.type === "sequence" || node.type === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  const intent: IAutoMovieIntent = last(
    HumanPocket.takeOut(AutoMovieMotionHumanChain.subject("a"), "phone", "grip", "right").node,
  );
  TestValidator.equals(
    "the pickup",
    [intent.capability, intent.parameters?.params],
    ["pickUp", { prop: "phone", handle: "grip", hand: "right", lift: 0 }],
  );
}
