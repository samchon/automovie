import {
  type IAutoMovieHumanFaceBasis,
  assertHumanFaceContact,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { throwsError } from "../internal/predicates";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * A contact declaration is admitted on names and neutral geometry alone.
 * Scenarios:
 * 1. The analytic fixture admits and builds; a basis without contact passes.
 * 2. Contact without articulation, aperture pairs that are absent, out of
 *    range or coincident, non-expression or self-referential closure, an
 *    absent tongue or nonpositive slab, a negative tolerance, no colliders or
 *    no soft surfaces, a collider with bad closure, reach or a repeated name,
 *    a soft entry that is a collider or has a negative budget, and a collider
 *    whose sealed neutral is not an oriented sheet each refuse by message.
 */
export const test_subject_human_contact_admission = (): void => {
  const { basis, document } = humanFaceContactFixture();
  createHumanFaceBasisBuilder(basis)(document);
  assertHumanFaceContact({ ...basis, contact: undefined });
  const contact = basis.contact!;
  const variant = (
    patch: (contact: Contact) => Partial<Contact>,
    message: string,
  ): boolean =>
    throwsError(
      () =>
        assertHumanFaceContact({
          ...basis,
          contact: { ...contact, ...patch(structuredClone(contact)) },
        }),
      message,
    );
  TestValidator.predicate(
    "contact needs articulation",
    throwsError(
      () => assertHumanFaceContact({ ...basis, articulation: undefined }),
      "needs the mandibular articulation",
    ),
  );
  const pairs: [(c: Contact) => Partial<Contact>, string][] = [
    [(c) => ({ lips: { ...c.lips, surface: "nose" } }), "lips need two"],
    [(c) => ({ lips: { ...c.lips, upper: 6 } }), "lips need two"],
    [(c) => ({ lips: { ...c.lips, lower: 0 } }), "lips need two"],
    [(c) => ({ incisors: { ...c.incisors, lower: 1.5 } }), "incisors need two"],
    [
      (c) => ({ closure: { ...c.closure, channel: "wide" } }),
      "expression channel: wide",
    ],
    [
      (c) => ({ closure: { ...c.closure, reference: "gone" } }),
      "expression channel: gone",
    ],
    [
      (c) => ({ passage: { ...c.passage, channel: "wide" } }),
      "expression channel: wide",
    ],
    [
      (c) => ({ closure: { ...c.closure, reference: "close" } }),
      "different reference",
    ],
    [
      (c) => ({ passage: { ...c.passage, surface: "palate" } }),
      "resident tongue surface",
    ],
    [(c) => ({ passage: { ...c.passage, slabMetres: 0 } }), "positive slab"],
    [() => ({ toleranceMetres: -1 }), "nonnegative tolerance"],
    [() => ({ colliders: [] }), "nonnegative tolerance"],
    [() => ({ soft: [] }), "nonnegative tolerance"],
    [
      (c) => ({
        colliders: [{ ...c.colliders[0], surface: "mouth" }, c.colliders[0]],
      }),
      "named once",
    ],
    [
      (c) => ({ colliders: [{ ...c.colliders[0], reachMetres: 0 }] }),
      "positive reach",
    ],
    [
      (c) => ({ colliders: [{ ...c.colliders[0], closure: [0, 1] }] }),
      "closure triangles",
    ],
    [
      (c) => ({ colliders: [{ ...c.colliders[0], closure: [0, 1, 99] }] }),
      "closure triangles",
    ],
    [
      () => ({ soft: [{ surface: "teeth", budgetMetres: 0 }] }),
      "not a collider",
    ],
    [
      (c) => ({ soft: [{ ...c.soft[0], budgetMetres: -0.1 }] }),
      "nonnegative budget",
    ],
    [(c) => ({ soft: [c.soft[0], c.soft[0]] }), "named once, not a collider"],
    [
      (c) => ({
        colliders: [
          { ...c.colliders[0], closure: [...c.colliders[0].closure, 9, 10, 6] },
        ],
      }),
      "singly or oppositely paired",
    ],
  ];
  for (const [patch, message] of pairs)
    TestValidator.predicate(
      "contact refusal: " + message,
      variant(patch, message),
    );
};
