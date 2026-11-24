import { HumanRefusal, wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `wardrobeHands.refusal` makes the refusal a wardrobe law throws, its kind
 * read from the axis: an opening is an affordance's, a reach a reach's, a base
 * a base's, anything else a parameter's.
 *
 * Scenarios: the four axes `opening`, `reach`, `base` and `side` refuse as an
 * affordance, a reach, a base and a parameter, each with its axis, value and
 * reason.
 */
export function test_unit_motions_dressing_wardrobe_hands_refusal(): void {
  const made: HumanRefusal[] = ["opening", "reach", "base", "side"].map(
    (axis: string): HumanRefusal =>
      wardrobeHands.refusal(axis, 0.3, `no ${axis}`),
  );
  TestValidator.equals(
    "the refusals",
    made.map((r: HumanRefusal) => [r.kind, r.axis, r.value, r.reason]),
    [
      ["affordance", "opening", 0.3, "no opening"],
      ["reach", "reach", 0.3, "no reach"],
      ["base", "base", 0.3, "no base"],
      ["parameter", "side", 0.3, "no side"],
    ],
  );
}