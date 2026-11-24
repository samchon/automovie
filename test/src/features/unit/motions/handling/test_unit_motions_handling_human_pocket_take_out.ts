import type { IAutoMovieComposition, IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { HumanPocket } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPocket.takeOut` appends a pick-up of the stowed prop by its handle
 * into the named hand, lifted nothing: the hand leaves the pocket as it
 * closes.
 *
 * Scenario, on a chain for subject `a`: taking `phone` out by `grip` with the
 * right hand appends that `pickUp`.
 */
export function test_unit_motions_handling_human_pocket_take_out(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.kind === "intent") return node.intent;
    if (node.kind === "sequence" || node.kind === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  const intent: IAutoMovieIntent = last(
    HumanPocket.takeOut(HumanChain.subject("a"), "phone", "grip", "right").node,
  );
  TestValidator.equals(
    "the pickup",
    [intent.capability, intent.parameters?.params],
    ["pickUp", { prop: "phone", handle: "grip", hand: "right", lift: 0 }],
  );
}