import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Shared domain metadata must remain real correspondence before any edit.
 * Scenarios:
 * 1. One-field malformed domain identity, origin and triangle populations refuse.
 * 2. Duplicate domains and malformed closure indices refuse on the neutral.
 * 3. A zero-count layer still resolves its surface/domain; valid zero stays bald.
 * 4. Generated part/material identities cannot collide with resident face IDs.
 */
export const test_subject_human_numerical_hair_domains = (): void => {
  const edits: ((
    basis: ReturnType<typeof numericalHairBasisFixture>["basis"],
  ) => void)[] = [
    (b) => {
      b.surfaces[0].hairDomains![0].id = " ";
    },
    (b) => {
      b.surfaces[0].hairDomains![0].origin[0] = Infinity;
    },
    (b) => {
      b.surfaces[0].hairDomains![0].triangles = [];
    },
    (b) => {
      b.surfaces[0].hairDomains![0].triangles = [-1];
    },
    (b) => {
      b.surfaces[0].hairDomains![0].triangles = [0.5];
    },
    (b) => {
      b.surfaces[0].hairDomains![0].triangles = [8];
    },
    (b) => {
      b.surfaces[0].hairDomains![0].triangles = [1, 0];
    },
    (b) => {
      b.surfaces[0].hairDomains!.push(
        structuredClone(b.surfaces[0].hairDomains![0]),
      );
    },
    (b) => {
      b.surfaces[0].hairContactClosure = [0];
    },
    (b) => {
      b.surfaces[0].hairContactClosure = [0, 1, -1];
    },
    (b) => {
      b.surfaces[0].hairContactClosure = [0, 1, 6];
    },
    (b) => {
      b.surfaces[0].hairContactClosure = [0, 1, 0.5];
    },
  ];
  for (const edit of edits) {
    const { basis } = numericalHairBasisFixture();
    edit(basis);
    TestValidator.predicate(
      "malformed shared correspondence refuses",
      throwsError(() => createHumanFaceBasisBuilder(basis)),
    );
  }
  const { basis, document } = numericalHairBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  document.hair!.layers[0].count = 0;
  TestValidator.equals(
    "valid empty population",
    build(document).parts.length,
    1,
  );
  document.hair!.layers[0].surface = "missing";
  TestValidator.predicate(
    "empty population still resolves names",
    throwsError(() => build(document)),
  );
  for (const kind of ["part", "material"] as const) {
    const input = numericalHairBasisFixture();
    if (kind === "part")
      input.basis.surfaces[0].regions[0].id = "numerical-hair:population";
    else {
      input.basis.materials[0].id = "numerical-hair:population:hair-cards";
      input.basis.surfaces[0].regions[0].material = input.basis.materials[0].id;
    }
    const generate = createHumanFaceBasisBuilder(input.basis);
    TestValidator.predicate(
      "resident identity collision refuses",
      throwsError(() => generate(input.document), "collide"),
    );
  }
};
