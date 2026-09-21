import { TestValidator } from "@nestia/e2e";

import { prepareFineBasisArtifacts } from "../../../scripts/face-review/prepareFineBasisArtifacts";
import { fineBasisPreparationFixture } from "../internal/fineBasisPreparationFixture";
import { throwsError } from "../internal/predicates";

/**
 * A preparation cannot silently bind native displacement or attachments to a
 * different correspondence. Refusals occur before any caller data changes.
 * Scenarios:
 * 1. A wrong neutral digest, colliding endpoint or moved source position refuses.
 * 2. An absent source triangle or a groom seated across the cut refuses.
 * 3. Stale groom, skin and document bindings refuse independently.
 * 4. A missing native endpoint refuses through ordinary basis admission; valid recovery works.
 * 5. Rigid membership cannot name an absent surface.
 */
export const test_subject_fine_basis_preparation_refusals = (): void => {
  type Input = ReturnType<typeof fineBasisPreparationFixture>;
  const mutations: ((input: Input) => void)[] = [
    (input) => {
      input.components.absent = input.components.attachment;
    },
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
      input.skins.colour.basis = "stale";
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
  TestValidator.equals(
    "valid recovery",
    prepareFineBasisArtifacts(fineBasisPreparationFixture()).receipt
      .admittedAddedEndpoints,
    3,
  );
};
