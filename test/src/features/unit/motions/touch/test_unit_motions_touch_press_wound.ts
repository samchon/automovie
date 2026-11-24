import type { IAutoMovieComposition, IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { pressWound } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `pressWound` appends one `touch` whose two palms press the wounded region of
 * the partner once and hold the authored seconds.
 *
 * Scenario, on a chain for subject `a`: pressing `b`'s left thigh for 5 s
 * presses it with both palms once and holds 5 s.
 */
export function test_unit_motions_touch_press_wound(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.kind === "intent") return node.intent;
    if (node.kind === "sequence" || node.kind === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  const intent: IAutoMovieIntent = last(
    pressWound(HumanChain.subject("a"), {
      partner: "b",
      region: "thighFrontLeft",
      hold: 5,
    }).node,
  );
  TestValidator.equals(
    "the pressure",
    [intent.capability, intent.parameters?.params],
    [
      "touch",
      {
        target: { kind: "person", subject: "b", region: "thighFrontLeft" },
        other: { kind: "person", subject: "b", region: "thighFrontLeft" },
        kind: "press",
        effector: "palm",
        count: 1,
        hold: 5,
      },
    ],
  );
}
