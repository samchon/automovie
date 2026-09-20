import {
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Numerical edits cannot silently change basis, channel meaning or material domain.
 *
 * Scenarios:
 * 1. Unknown schema/basis/identity, wrong channel group and adjacent range errors refuse.
 * 2. Invalid appearance names and coefficients refuse without mutating a prior result.
 * 3. Endpoint-induced overflow and material/model defects reach the actual model gate.
 * 4. Empty and exact-boundary material edits remain accepted.
 */
export const test_subject_human_basis_controls = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const build = createHumanFaceBasisBuilder(basis),
    neutral = build(document);
  const patches: Partial<IAutoMovieHumanFaceBasisDocument>[] = [
    { version: "unknown" } as never,
    { basis: "different" },
    { id: "" },
    { name: " " },
    { shape: { missing: 0 } },
    { shape: { lift: 0 } },
    { expression: { width: 0 } },
    { shape: { width: 1.001 } },
    { shape: { width: -1.001 } },
    { expression: { lift: -0.001 } },
    { expression: { lift: Infinity } },
    { shape: { width: NaN } },
    { materials: { unknown: {} } },
    { materials: { skin: { roughness: -0.001 } } },
    { materials: { skin: { roughness: 1.001 } } },
    { materials: { skin: { roughness: Infinity } } },
    { materials: { skin: { color: { r: 1.001, g: 0, b: 0 } } } },
    { materials: { skin: { color: { r: 0, g: -0.001, b: 0 } } } },
  ];
  for (const patch of patches)
    TestValidator.predicate(
      "invalid edit refuses",
      throwsError(() => build({ ...document, ...patch })),
    );
  TestValidator.predicate(
    "unknown document field",
    throwsError(() => build({ ...document, surprise: 1 } as never)),
  );
  TestValidator.equals(
    "refusal leaves later neutral exact",
    build(document),
    neutral,
  );
  for (const value of [0, 1])
    TestValidator.equals(
      "roughness endpoint remains accepted",
      build({ ...document, materials: { skin: { roughness: value } } })
        .materials[0].roughness,
      value,
    );
  const overflow = humanFaceBasisFixture();
  overflow.basis.channels[0].maximum = Number.MAX_VALUE;
  overflow.basis.surfaces[0].targets.wide[1] = Number.MAX_VALUE;
  TestValidator.predicate(
    "overflow cannot form normals",
    throwsError(() =>
      createHumanFaceBasisBuilder(overflow.basis)({
        ...overflow.document,
        shape: { width: Number.MAX_VALUE },
      }),
    ),
  );
  const invalidMaterial = humanFaceBasisFixture();
  invalidMaterial.basis.materials[0].roughness = 2;
  TestValidator.predicate(
    "model material gate remains active",
    throwsError(
      () =>
        createHumanFaceBasisBuilder(invalidMaterial.basis)(
          invalidMaterial.document,
        ),
      "valid resident model",
    ),
  );
};
