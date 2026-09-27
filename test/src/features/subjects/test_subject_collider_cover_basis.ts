import { TestValidator } from "@nestia/e2e";

import { prepareColliderCoverBasis } from "../../../scripts/face-review/prepareColliderCoverBasis";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { throwsError } from "../internal/predicates";

/**
 * A rigid collider's cover as a basis revision.
 * Scenarios:
 * 1. The teeth collider takes the cover, every other collider and field is
 *    as it was, the documents build and are restamped with the control map,
 *    and the input is left as it was.
 * 2. An unchanged or blank revision and a surface with no collider refuse.
 */
export const test_subject_collider_cover_basis = (): void => {
  const { basis, document } = humanFaceContactFixture();
  const before = JSON.stringify(basis);
  const input = {
    basis,
    documents: [document],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-contact/9",
    surface: "teeth",
    coverMetres: 0.01,
  };
  const out = prepareColliderCoverBasis(input);
  const teeth = out.basis.contact!.colliders.find(
    (one) => one.surface === "teeth",
  )!;
  const others = out.basis.contact!.colliders.filter(
    (one) => one.surface !== "teeth",
  );
  TestValidator.predicate(
    "cover",
    teeth.coverMetres === 0.01 &&
      others.every((one) => one.coverMetres === undefined) &&
      out.basis.id === "analytic-contact/9" &&
      out.documents[0]!.basis === "analytic-contact/9" &&
      out.controls.basis === "analytic-contact/9" &&
      out.receipt.documents === 1 &&
      JSON.stringify(basis) === before,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareColliderCoverBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareColliderCoverBasis({ ...input, revision: " " }),
        "distinct revision",
      ) &&
      throwsError(
        () => prepareColliderCoverBasis({ ...input, surface: "nose" }),
        "No contact collider on nose",
      ),
  );
};
