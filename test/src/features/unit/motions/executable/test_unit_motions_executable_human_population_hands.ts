import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { HumanPopulationAccess, f1 } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPopulationAccess.hands` reads a person's two hands, left then right,
 * and none when the inputs omit them.
 *
 * Scenarios:
 *
 * 1. The reference woman `f1` gives her left then her right hand.
 * 2. Without extremities there is no hand.
 */
export function test_unit_motions_executable_human_population_hands(): void {
  const bare: IAutoMovieHumanParameters = structuredClone(f1);
  delete bare.extremities;
  TestValidator.equals(
    "two hands, or none",
    [HumanPopulationAccess.hands(f1), HumanPopulationAccess.hands(bare)],
    [[f1.extremities!.hands!.left, f1.extremities!.hands!.right], []],
  );
}
