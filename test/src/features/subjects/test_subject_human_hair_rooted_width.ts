import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { buildHumanFaceHairMesh } from "@automovie/human";
import { float32MeshBuffers } from "@automovie/human/common/mesh/float32MeshBuffers";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairMeshContext } from "../internal/createNumericalHairMeshContext";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * A density-coverage ribbon exposes its surface-boundary width fit explicitly.
 * Scenarios:
 * 1. A 0.5 mm gap stem caps a nominal 4 mm ribbon to 1 mm by the signed-distance
 *    ball; its free 4 mm-gap row retains the nominal width and requested gap.
 * 2. Every stem row remains emitted, with unchanged centre; Float32 corners and
 *    every triangle's centroid remain above the independent cube plane y=1.
 * 3. Missing, zero, fractional and past-end freeFrom metadata refuse by name.
 *    A stem station on the surface cannot hide its root with a zero-width row.
 * 4. Missing separation readers or incomplete per-curve context arrays receive
 *    a named refusal next to the same supported fixture, without a fallback.
 */
export const test_subject_human_hair_rooted_width = (): void => {
  const host = createSignedVoxelUnion([[0, 0, 0]]);
  const query = createAutoMovieSignedMeshQuery(host);
  const context = createNumericalHairMeshContext(
    host,
    [{ triangle: 6, weights: [0.5, 0, 0.5] }],
    [{ remaining: 1_000_000 }],
  );
  const points = [
    Vector3.create(0.5, 1, 0.5),
    Vector3.create(0.502, 1.0005, 0.5),
    Vector3.create(0.502, 1.004, 0.5),
    Vector3.create(0.51, 1.004, 0.5),
  ];
  const length = points
    .slice(1)
    .reduce(
      (sum, p, at) => sum + Vector3.length(Vector3.subtract(p, points[at])),
      0,
    );
  const curve = {
    points,
    length,
    freeFrom: 2,
    normal: Vector3.create(0, 1, 0),
    clearance: 0.002,
  };
  const layer = { clearance: 0.001, taper: { start: 0.7, tipWidth: 1 } };
  const supportedProps = { widths: [0.004], query, ...context };
  const invalidContext = [
    { separation: undefined },
    { separation: null },
    { separation: { ...context.separation, source: undefined } },
    { separation: { ...context.separation, represented: undefined } },
    { budgets: undefined },
    { attachments: undefined },
    { budgets: [] },
    { attachments: [] },
  ];
  for (const broken of invalidContext)
    TestValidator.predicate(
      "missing same-source mesh context refuses",
      throwsError(
        () =>
          buildHumanFaceHairMesh(
            [curve],
            layer,
            { ...supportedProps, ...broken } as unknown as Parameters<typeof buildHumanFaceHairMesh>[2],
          ),
        "same-source separation readers",
      ),
    );
  const mesh = buildHumanFaceHairMesh([curve], layer, {
    widths: [0.004],
    query,
    ...context,
  });
  const row = (at: number) =>
    [0, 1].map((side) =>
      Vector3.create(
        ...(mesh.positions.slice(
          3 * (2 * at - 1 + side),
          3 * (2 * at + side),
        ) as [number, number, number]),
      ),
    );
  const first = row(1),
    free = row(2);
  TestValidator.predicate(
    "geometry caps proxy width without changing the stem centre",
    nclose(
      Vector3.length(Vector3.subtract(first[1], first[0])),
      0.001,
      1e-12,
    ) &&
      vclose(
        Vector3.scale(Vector3.add(first[0], first[1]), 0.5),
        points[1],
        1e-12,
      ),
  );
  TestValidator.predicate(
    "the free row retains nominal coverage width",
    nclose(Vector3.length(Vector3.subtract(free[1], free[0])), 0.004, 1e-12),
  );
  const packed = float32MeshBuffers(mesh);
  for (let at = 1; at < packed.positions.length / 3; at++)
    TestValidator.predicate(
      "actual Float32 nonroot corner is exterior",
      packed.positions[3 * at + 1] > 1,
    );
  for (let at = 0; at < packed.indices.length; at += 3) {
    const ids = Array.from(packed.indices.slice(at, at + 3));
    TestValidator.predicate(
      "each actual triangle centroid is exterior",
      ids.reduce((sum, id) => sum + packed.positions[3 * id + 1], 0) / 3 > 1,
    );
  }
  for (const freeFrom of [undefined, 0, 1.5, points.length])
    TestValidator.predicate(
      "legacy or invalid metadata receives a named refusal",
      throwsError(
        () =>
          buildHumanFaceHairMesh(
            [{ ...curve, freeFrom } as unknown as typeof curve],
            layer,
            { widths: [0.004], query, ...context },
          ),
        "freeFrom",
      ),
    );
  TestValidator.predicate(
    "a zero-gap stem cannot emit a hidden zero-width row",
    throwsError(
      () =>
        buildHumanFaceHairMesh(
          [
            {
              ...curve,
              points: [
                points[0],
                Vector3.create(0.502, 1, 0.5),
                ...points.slice(2),
              ],
            },
          ],
          layer,
          { widths: [0.004], query, ...context },
        ),
      "positive exterior row width",
    ),
  );
};
