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
 * 5. Frozen rigid membership reaches the real builder and preserves a fixed attachment.
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
    "skin binding",
    result.skins.colour.basis,
    input.revision,
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
    rigidComponents: 1,
  });
  const model = createHumanFaceBasisBuilder(result.basis)({
    ...result.documents[1],
    shape: { depth: 1 },
  });
  const geometry = model.parts[0].geometry;
  if (geometry.type !== "mesh") throw new Error("Expected prepared mesh.");
  TestValidator.predicate(
    "forward endpoint",
    nclose(geometry.mesh.positions[2], 0.1),
  );
  const before = createHumanFaceBasisBuilder(input.basis)(input.documents[1]);
  const performed = createHumanFaceBasisBuilder(result.basis)({
    ...result.documents[1],
    expression: { lift: 1 },
  });
  TestValidator.equals(
    "prepared rigid membership performs",
    performed.parts[2],
    before.parts[2],
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
  empty.components = {};
  empty.documents = [];
  empty.grooms = {};
  empty.skins = {};
  empty.controls.groups = [];
  const bare = prepareFineBasisArtifacts(empty);
  TestValidator.equals("empty population", bare.receipt.admittedDocuments, 0);
  TestValidator.equals(
    "empty rigid declaration",
    bare.receipt.rigidComponents,
    0,
  );
  TestValidator.equals(
    "empty curation",
    bare.receipt.admittedAddedEndpoints,
    0,
  );
};
