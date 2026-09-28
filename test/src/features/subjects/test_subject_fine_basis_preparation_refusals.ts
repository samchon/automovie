import { TestValidator } from "@nestia/e2e";

import { prepareFineBasisArtifacts } from "../../../scripts/face-review/prepareFineBasisArtifacts";
import { fineBasisPreparationFixture } from "../internal/fineBasisPreparationFixture";
import { throwsError } from "../internal/predicates";

/**
 * A preparation cannot silently bind native displacement or attachments to a
 * different correspondence. Refusals occur before any caller data changes.
 * Scenarios:
 * 1. A wrong neutral digest, undeclared endpoint or moved source position refuses.
 * 2. An absent source triangle or a groom seated across the cut refuses.
 * 3. Stale groom/document bindings and absent pigment surfaces refuse independently.
 * 4. A missing native endpoint refuses through ordinary basis admission; valid recovery works.
 * 5. A discarded repeated-corner triangle cannot alias a later groom seat; a valid seat still prepares.
 */
export const test_subject_fine_basis_preparation_refusals = (): void => {
  type Input = ReturnType<typeof fineBasisPreparationFixture>;
  const mutations: ((input: Input) => void)[] = [
    (input) => {
      input.native.surfaces[0].neutralFloat64LESha256 = "wrong";
    },
    (input) => {
      input.basis.surfaces[0].targets["depth.positive"] = [0, 0, 0, 0.1];
    },
    (input) => {
      input.source.surfaces[0].positions[0] += 0.1;
    },
    (input) => {
      input.source.surfaces[0].regions[0].indices.splice(0, 3);
      input.source.surfaces[0].regions[0].uvs!.splice(0, 6);
    },
    (input) => {
      input.grooms.locks.cards[0].triangle = 0;
    },
    (input) => {
      input.grooms.locks.basis = "stale";
    },
    (input) => {
      input.documents[0].skin = { absent: [] };
    },
    (input) => {
      input.documents[0].basis = "stale";
    },
    (input) => {
      delete input.native.surfaces[0].targets["nativeDepth.positive"];
    },
  ];
  for (const mutate of mutations) {
    const input = fineBasisPreparationFixture();
    mutate(input);
    const saved = structuredClone(input);
    TestValidator.predicate(
      "invalid preparation refuses",
      throwsError(() => prepareFineBasisArtifacts(input)),
    );
    TestValidator.equals("refusal preserves caller", input, saved);
  }
  const contact = fineBasisPreparationFixture();
  contact.basis.contact = {
    lips: { surface: "skin", upper: 0, lower: 1 },
    incisors: { surface: "skin", upper: 0, lower: 1 },
    closure: { channel: "a", reference: "b" },
    passage: { surface: "skin", channel: "a", slabMetres: 1 },
    colliders: [],
    soft: [],
    toleranceMetres: 0,
  };
  TestValidator.predicate(
    "oral contact is prepared after clipping",
    throwsError(
      () => prepareFineBasisArtifacts(contact),
      "Prepare oral contact after facial clipping",
    ),
  );
  TestValidator.equals(
    "valid recovery",
    prepareFineBasisArtifacts(fineBasisPreparationFixture()).receipt
      .admittedAddedEndpoints,
    3,
  );
  const degenerate = fineBasisPreparationFixture();
  for (const basis of [degenerate.basis, degenerate.source]) {
    basis.surfaces[0].indices.splice(0, 3, 0, 0, 1);
    basis.surfaces[0].regions[0].indices.splice(0, 3, 0, 0, 1);
  }
  degenerate.grooms.locks.cards[0].triangle = 0;
  TestValidator.predicate(
    "discarded source seat refuses instead of moving to a later face",
    throwsError(
      () => prepareFineBasisArtifacts(degenerate),
      "Groom seat crosses the new cut",
    ),
  );
  degenerate.grooms.locks.cards[0].triangle = 1;
  TestValidator.equals(
    "retained source seat still prepares",
    prepareFineBasisArtifacts(degenerate).grooms.locks.cards[0].triangle,
    0,
  );
};
