import { defend } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The `defend` law's telegraph (`defend.telegraph`): how much of an attack's
 * preparation shows: a round kick's chamber all of it, a push kick or knee 0.8,
 * a rear-hand or curved punch 0.6, a lead jab 0.4.
 *
 * Scenario: a round kick 1, a push kick 0.8, a lead straight 0.4, a lead hook
 * 0.6, a rear straight 0.6, a knee 0.8.
 */
export function test_unit_motions_striking_defend(): void {
  TestValidator.equals(
    "the telegraph",
    [
      defend.telegraph({ family: "kick", params: { technique: "round" } }),
      defend.telegraph({ family: "kick", params: { technique: "push" } }),
      defend.telegraph({ family: "punch", params: { technique: "straight" } }),
      defend.telegraph({ family: "punch", params: { technique: "hook" } }),
      defend.telegraph({
        family: "punch",
        params: { technique: "straight", hand: "rear" },
      }),
      defend.telegraph({ family: "knee", params: {} }),
    ],
    [1, 0.8, 0.4, 0.6, 0.6, 0.8],
  );
}
