import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";

/**
 * Selecting every sampled root as a guide preserves the flat numerical layer.
 * This isolates hierarchy equivalence from the separate sixteen-root placement
 * experiment without changing either scenario's length, geometry or budget.
 * Scenarios:
 * 1. A flat two-root 50 mm layer and its all-guide counterpart emit identical
 *    owned parts through the same current basis builder.
 */
export const test_subject_human_numerical_hair_guided_equivalence = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const flat = build(document);
  const everyRoot = structuredClone(document);
  for (const layer of everyRoot.hair!.layers)
    layer.guides = { fraction: 1, neighbours: 3 };
  TestValidator.equals(
    "all-guide layer equals the flat layer",
    build(everyRoot).parts,
    flat.parts,
  );
};
