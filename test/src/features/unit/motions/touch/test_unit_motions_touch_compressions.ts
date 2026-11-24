import type { IAutoMovieComposition, IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { compressions } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The compressions of one cycle: 30, the 30:2 compression-to-ventilation ratio
 * of adult CPR (2020 AHA Guidelines for CPR and ECC).
 */
const CYCLE: number = 30;

/**
 * `compressions` appends one cycle of chest compressions: both palms press the
 * partner's sternum 30 times with the arms straight and no hold.
 *
 * Scenario, on a chain for subject `a`: compressing `b` appends a `touch` whose
 * two hands press `b`'s sternum 30 times with straight arms.
 */
export function test_unit_motions_touch_compressions(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.kind === "intent") return node.intent;
    if (node.kind === "sequence" || node.kind === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  const intent: IAutoMovieIntent = last(
    compressions(HumanChain.subject("a"), { partner: "b" }).node,
  );
  TestValidator.equals(
    "the compressions",
    [intent.subject, intent.capability, intent.parameters?.params],
    [
      "a",
      "touch",
      {
        target: { kind: "person", subject: "b", region: "sternum" },
        other: { kind: "person", subject: "b", region: "sternum" },
        kind: "press",
        effector: "palm",
        arms: "straight",
        count: CYCLE,
        hold: 0,
      },
    ],
  );
}
