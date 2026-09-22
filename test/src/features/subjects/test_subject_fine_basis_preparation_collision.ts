import { assertHumanFaceBasis } from "@automovie/human/face/basis/assertHumanFaceBasis";
import { TestValidator } from "@nestia/e2e";

import { prepareFineBasisArtifacts } from "../../../scripts/face-review/prepareFineBasisArtifacts";
import { fineBasisPreparationFixture } from "../internal/fineBasisPreparationFixture";
import { throwsError } from "../internal/predicates";

/**
 * Native endpoint names cannot overwrite an already admitted channel's field.
 * A declared existing endpoint reaches the collision guard; an undeclared
 * target would instead fail initial basis admission and leave this untested.
 * Scenarios:
 * 1. A valid width endpoint named depth.positive refuses native depth insertion
 *    at the collision guard and preserves every caller-owned input.
 * 2. A distinct existing endpoint permits insertion and preserves its field.
 */
export const test_subject_fine_basis_preparation_collision = (): void => {
  const input = fineBasisPreparationFixture();
  const surface = input.basis.surfaces[0];
  const width = surface.targets.wide;
  surface.targets["depth.positive"] = width;
  delete surface.targets.wide;
  input.basis.channels[0].positive = "depth.positive";
  assertHumanFaceBasis(input.basis);
  const saved = structuredClone(input);
  TestValidator.predicate(
    "admitted endpoint collision refuses before overwrite",
    throwsError(
      () => prepareFineBasisArtifacts(input),
      "Colliding native endpoint: square/depth.positive",
    ),
  );
  TestValidator.equals("collision preserves caller", input, saved);

  surface.targets["width.positive"] = width;
  delete surface.targets["depth.positive"];
  input.basis.channels[0].positive = "width.positive";
  assertHumanFaceBasis(input.basis);
  const prepared = prepareFineBasisArtifacts(input);
  TestValidator.equals(
    "distinct existing endpoint survives preparation",
    prepared.basis.surfaces[0].targets["width.positive"],
    width,
  );
  TestValidator.equals(
    "native endpoints are admitted beside the existing field",
    prepared.receipt.admittedAddedEndpoints,
    3,
  );
};
