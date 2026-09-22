import { validateModel } from "@automovie/engine";
import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Fixed source connectivity does not prevent morphs from changing welded topology.
 *
 * Scenarios:
 * 1. Two separate triangles prepare; a half displacement changes their partition legally.
 * 2. A full displacement superposes equally wound triangles and must reach model refusal.
 * 3. A refused edit and mutated returned arrays cannot poison later legal replay.
 * 4. An invalid source material refuses during preparation, before any document can override it.
 */
export const test_subject_human_basis_topology_reuse = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  basis.channels = [basis.channels[0]];
  basis.surfaces = [
    {
      id: "two-triangles",
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0],
      indices: [0, 1, 2, 3, 4, 5],
      targets: {
        wide: [3, -2, 0, 0, 4, -2, 0, 0, 5, -2, 0, 0],
        narrow: [3, 1, 0, 0],
      },
      regions: [
        {
          id: "pair",
          material: "skin",
          indices: [0, 1, 2, 3, 4, 5],
          uvs: null,
        },
      ],
    },
  ];
  const build = createHumanFaceBasisBuilder(basis);
  const neutral = build(document);
  const half = { ...document, shape: { width: 0.5 } };
  TestValidator.equals(
    "changed partition can still be valid",
    validateModel({ model: build(half) }).success,
    true,
  );
  TestValidator.predicate(
    "new same-winding incidence refuses",
    throwsError(
      () => build({ ...document, shape: { width: 1 } }),
      "valid resident model",
    ),
  );
  TestValidator.equals(
    "refusal does not replace the admitted neutral",
    build(document),
    neutral,
  );
  const altered = build(half).parts[0].geometry;
  if (altered.type !== "mesh")
    throw new Error("Expected the prepared triangle population.");
  altered.mesh.indices![0] = 5;
  altered.mesh.positions.fill(0);
  TestValidator.equals(
    "returned buffers cannot alter compiled admission",
    validateModel({ model: build(half) }).success,
    true,
  );
  const invalid = humanFaceBasisFixture();
  invalid.basis.materials[0].roughness = 2;
  TestValidator.predicate(
    "source palette is admitted before any edit",
    throwsError(
      () => createHumanFaceBasisBuilder(invalid.basis),
      "valid resident model",
    ),
  );
};
