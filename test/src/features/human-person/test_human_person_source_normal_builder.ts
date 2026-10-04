import { createHumanPersonBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonSourceBasisFixture } from "../internal/humanPersonSourceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The person consumer evaluates source-bound shading at rest and after posing.
 * A single eight-sided tube is partitioned through original source ring IDs;
 * the two halves retain their topology and caller documents unchanged.
 *
 * Scenarios:
 * 1. Normal source input builds without recropping cells or adding a ribbon.
 * 2. A supported head turn evaluates current normals; returning to rest is
 *    deterministic. Invalid document recovery preserves caller values.
 * 3. Missing source provenance on one half refuses in the actual builder.
 */
export const test_human_person_source_normal_builder = (): void => {
  const fixture = humanPersonSourceBasisFixture();
  const documentBefore = JSON.stringify(fixture.document);
  const build = createHumanPersonBuilder(fixture);
  const rest = build(fixture.document);
  TestValidator.equals(
    "normal source consumer keeps both skins and the rigid part",
    rest.model.parts.length,
    3,
  );
  TestValidator.equals(
    "the canonical tube needs no ribbon",
    rest.seam.ribbonTriangles,
    0,
  );
  TestValidator.predicate(
    "same source boundary needs no collar displacement",
    nclose(rest.seam.collarShiftMetres, 0, 1e-12),
  );
  const posed = build({
    ...fixture.document,
    body: {
      ...fixture.document.body,
      pose: [{ bone: "head", flexion: null, abduction: null, twist: 30 }],
    },
  });
  const normals = (model: typeof rest.model) =>
    model.parts.flatMap((part) =>
      part.geometry.type === "mesh" ? (part.geometry.mesh.normals ?? []) : [],
    );
  TestValidator.predicate(
    "the posed consumer evaluates a new normal field",
    normals(posed.model).some(
      (value, i) => !nclose(value, normals(rest.model)[i], 1e-8),
    ),
  );
  TestValidator.predicate(
    "invalid edit does not gain source authority",
    throwsError(
      () =>
        build({
          ...fixture.document,
          body: { ...fixture.document.body, shape: { missing: 1 } },
        }),
      "Unsupported",
    ),
  );
  const returned = build(fixture.document);
  TestValidator.predicate(
    "rest normals recover deterministically",
    normals(returned.model).every((value, i) =>
      nclose(value, normals(rest.model)[i], 1e-12),
    ),
  );
  TestValidator.equals(
    "caller document remains unchanged",
    JSON.stringify(fixture.document),
    documentBefore,
  );
  const incomplete = humanPersonSourceBasisFixture();
  incomplete.body.surfaces[0].sourcePartition = undefined;
  TestValidator.predicate(
    "actual builder refuses a partial source generation",
    throwsError(
      () => createHumanPersonBuilder(incomplete),
      "both compiled halves",
    ),
  );
};
