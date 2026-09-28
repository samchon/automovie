import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareFineBasisArtifacts } from "../../../scripts/face-review/prepareFineBasisArtifacts";
import { fineBasisPreparationFixture } from "../internal/fineBasisPreparationFixture";
import { nclose } from "../internal/predicates";

/**
 * Shared endpoint preparation preserves personal coordinates and attachment
 * identity while rebuilding a clipped source correspondence.
 * Scenarios:
 * 1. A removed triangle shifts a surviving groom seat from ordinal one to zero.
 * 2. Paired and one-sided native fields add three admitted endpoints; omitted
 *    zero fields leave the independent attachment unchanged.
 * 3. All bindings update, bare/decorated documents build, and input data stays owned.
 * 4. No curation or documents is a valid empty preparation population.
 */
export const test_subject_fine_basis_preparation = (): void => {
  const input = fineBasisPreparationFixture();
  const saved = structuredClone(input);
  const result = prepareFineBasisArtifacts(input);
  TestValidator.equals("recipe does not mutate inputs", input, saved);
  TestValidator.equals(
    "surviving seat shifts",
    result.grooms.locks.cards.map((card) => card.triangle),
    [0, 0],
  );
  TestValidator.equals(
    "new binding",
    result.documents.map((one) => one.basis),
    [input.revision, input.revision],
  );
  TestValidator.equals(
    "numerical pigmentation preserved",
    result.documents[0].skin,
    input.documents[0].skin,
  );
  TestValidator.equals(
    "groom binding",
    result.grooms.locks.basis,
    input.revision,
  );
  TestValidator.equals("map binding", result.controls.basis, input.revision);
  TestValidator.equals(
    "personal shape unchanged",
    result.documents[0].shape,
    input.documents[0].shape,
  );
  TestValidator.equals("receipt", result.receipt, {
    revision: input.revision,
    minimumY: 0,
    remappedGroomSeats: 1,
    addedShapeChannels: 2,
    admittedAddedEndpoints: 3,
    admittedDocuments: 2,
  });
  TestValidator.equals(
    "historical bare input has no groom",
    input.documents[1].hair,
    undefined,
  );
  TestValidator.equals(
    "prepared bare input has no groom",
    result.documents[1].hair,
    undefined,
  );
  const { hair: inputHair, ...bareInput } = input.documents[1];
  const { hair: preparedHair, ...bareResult } = result.documents[1];
  const model = createHumanFaceBasisBuilder(result.basis)({
    ...bareResult,
    shape: { depth: 1 },
  });
  const geometry = model.parts[0].geometry;
  if (geometry.type !== "mesh") throw new Error("Expected prepared mesh.");
  TestValidator.predicate(
    "forward endpoint",
    nclose(geometry.mesh.positions[2], 0.1),
  );
  const before = createHumanFaceBasisBuilder(input.basis)(bareInput);
  const performed = createHumanFaceBasisBuilder(result.basis)({
    ...bareResult,
    expression: { lift: 1 },
  });
  TestValidator.equals(
    "independent attachment performs as before",
    performed.parts[2],
    createHumanFaceBasisBuilder(input.basis)({
      ...bareInput,
      expression: { lift: 1 },
    }).parts[2],
  );
  TestValidator.equals(
    "independent attachment unchanged",
    model.parts[2],
    before.parts[2],
  );
  TestValidator.equals(
    "description survives",
    result.basis.channels[2].description,
    input.entries[0].description,
  );
  const empty = fineBasisPreparationFixture();
  empty.entries = [];
  empty.documents = [];
  empty.grooms = {};
  empty.controls.groups = [];
  const bare = prepareFineBasisArtifacts(empty);
  TestValidator.equals("empty population", bare.receipt.admittedDocuments, 0);
  TestValidator.equals(
    "empty curation",
    bare.receipt.admittedAddedEndpoints,
    0,
  );
};
