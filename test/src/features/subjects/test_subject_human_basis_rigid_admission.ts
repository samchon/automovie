import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A rigid declaration cannot split a connected triangle or assign it twice.
 * Scenarios:
 * 1. Empty, repeated, descending, nonresident and shared membership refuses.
 * 2. Both a selected first corner and a selected later corner expose a torn triangle.
 * 3. Repeated/empty names refuse; absent and empty group lists retain linear behavior.
 */
export const test_subject_human_basis_rigid_admission = (): void => {
  const group = { id: "arch", vertices: [0, 1, 2, 3], motion: "fit" as const };
  const cases = [
    ...[[], [0, 0], [1, 0], [-1], [4], [0.5], [0], [1], [0, 1]].map(
      (vertices) => [{ ...group, vertices }],
    ),
    [{ ...group, id: "" }],
    [group, { ...group, vertices: [0] }],
    [group, { ...group, id: "other", vertices: [0] }],
  ];
  for (const rigidGroups of cases) {
    const { basis } = humanFaceBasisFixture();
    basis.surfaces[0].rigidGroups = rigidGroups;
    TestValidator.predicate(
      "malformed rigid ownership refuses",
      throwsError(() => createHumanFaceBasisBuilder(basis)),
    );
  }
  for (const invalid of [
    { ...group, motion: "stretch" },
    { ...group, vertices: null },
    { ...group, vertices: [NaN] },
    { ...group, id: "   " },
  ]) {
    const { basis } = humanFaceBasisFixture();
    basis.surfaces[0].rigidGroups = [
      invalid,
    ] as unknown as IAutoMovieHumanFaceBasis["surfaces"][number]["rigidGroups"];
    TestValidator.predicate(
      "external rigid declaration obeys schema and finite membership",
      throwsError(() => createHumanFaceBasisBuilder(basis)),
    );
  }
  const { basis, document } = humanFaceBasisFixture();
  const before = createHumanFaceBasisBuilder(basis)(document);
  basis.surfaces[0].rigidGroups = [];
  TestValidator.equals(
    "empty groups preserve behavior",
    createHumanFaceBasisBuilder(basis)(document),
    before,
  );
};
