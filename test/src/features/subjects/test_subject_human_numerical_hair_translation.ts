import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Skin translation transports the generated hair without changing its neutral
 * numerical field. This exercises the actual basis builder on an analytic solid.
 * Scenarios:
 * 1. A 10 mm X translation moves every generated station by exactly that vector.
 * 2. Root identities, strip topology and the caller-owned document remain fixed.
 */
export const test_subject_human_numerical_hair_translation = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const before = structuredClone(document);
  const build = createHumanFaceBasisBuilder(basis);
  const hair = build(document).parts[1].geometry;
  const moved = build({ ...document, shape: { translate: 1 } }).parts[1]
    .geometry;
  if (hair.type !== "mesh" || moved.type !== "mesh")
    throw new Error("Expected generated numerical hair meshes.");
  TestValidator.equals(
    "translation preserves topology",
    moved.mesh.indices,
    hair.mesh.indices,
  );
  TestValidator.predicate(
    "translation follows barycentric skin",
    hair.mesh.positions.every((value, at) =>
      nclose(moved.mesh.positions[at], value + (at % 3 === 0 ? 0.01 : 0), 1e-9),
    ),
  );
  TestValidator.equals("document ownership", document, before);
};
