import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { kneelBeside } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `kneelBeside` appends a kneel on both knees that stays down, the right knee
 * coming down at the given floor point beside the partner.
 *
 * Scenario, on a chain for subject `a`: kneeling at (0.4, 0, 1) appends a
 * `kneel` of both knees, no hold, no rise, at that point.
 */
export function test_unit_motions_touch_kneel_beside(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.kind === "intent") return node.intent;
    if (node.kind === "sequence" || node.kind === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  const at: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: { x: 0.4, y: 0, z: 1 },
  };
  const intent: IAutoMovieIntent = last(
    kneelBeside(HumanChain.subject("a"), { at }).node,
  );
  TestValidator.equals(
    "the kneel",
    [intent.capability, intent.parameters?.params],
    ["kneel", { kind: "both", hold: 0, rise: false, at }],
  );
}
