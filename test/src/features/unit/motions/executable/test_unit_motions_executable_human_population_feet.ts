import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { HumanPopulationAccess, f1 } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPopulationAccess.feet` reads a person's two feet, left then right, and
 * none when the inputs omit them.
 *
 * Scenarios:
 *
 * 1. The reference woman `f1` gives her left then her right foot, whose lengths
 *    differ by a hundredth of a micrometre.
 * 2. Without extremities there is no foot.
 */
export function test_unit_motions_executable_human_population_feet(): void {
  const bare: IAutoMovieHumanParameters = structuredClone(f1);
  delete bare.extremities;
  TestValidator.equals(
    "two feet in order, or none",
    [HumanPopulationAccess.feet(f1), HumanPopulationAccess.feet(bare)],
    [[f1.extremities!.feet!.left, f1.extremities!.feet!.right], []],
  );
}
