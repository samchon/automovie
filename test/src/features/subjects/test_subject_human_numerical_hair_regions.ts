import { Vector3 } from "@automovie/engine";
import { assertHumanFaceHair } from "@automovie/human";
import { createHumanFaceHairRoots } from "@automovie/human/face/anatomy/hair/createHumanFaceHairRoots";
import { humanFaceHairEnvelope } from "@automovie/human/face/anatomy/hair/humanFaceHairEnvelope";
import { humanFaceHairSequence } from "@automovie/human/face/anatomy/hair/humanFaceHairSequence";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Local root populations use declared metric density, without saving seats.
 * Scenarios:
 * 1. A Gaussian is one at its centre and exp(-1/2) one standard deviation away;
 *    absent and underflowing envelopes are respectively one and zero.
 * 2. Rejection matches the independent base-13 probability inequality on an
 *    analytic octahedron, retaining seats and the prefix when count increases.
 * 3. An unmasked population reports its whole growth domain as the area it
 *    grows on, and the localized one reports the smaller share its rejection
 *    left, which is what a small population reads its density from.
 * 4. Translation of both mesh/chart and region preserves weights and identities.
 * 5. Finite regions admit without mutation; nonfinite centres, nonpositive or
 *    infinite spreads refuse even when the population count is zero.
 */
export const test_subject_human_numerical_hair_regions = (): void => {
  const region = { center: [0, 0, 0], spread: [0.25, 1, 1] } as const;
  const envelope = {
    center: [...region.center] as [number, number, number],
    spread: [...region.spread] as [number, number, number],
  };
  TestValidator.equals(
    "unlocalized weight",
    humanFaceHairEnvelope(Vector3.create(), undefined),
    1,
  );
  TestValidator.equals(
    "peak weight",
    humanFaceHairEnvelope(Vector3.create(), envelope),
    1,
  );
  TestValidator.predicate(
    "one deviation",
    nclose(
      humanFaceHairEnvelope(Vector3.create(0.25), envelope),
      Math.exp(-0.5),
    ),
  );
  TestValidator.equals(
    "remote underflow",
    humanFaceHairEnvelope(Vector3.create(100), envelope),
    0,
  );
  const mesh = createSignedOctahedron();
  const input = {
    positions: mesh.positions,
    indices: mesh.indices!,
    triangles: [0, 1, 2, 3, 4, 5, 6, 7],
    origin: [0, 0, 0] as [number, number, number],
  };
  const sample = createHumanFaceHairRoots(input);
  const layer = createNumericalHairFixture().layers[0];
  const candidates = sample({ ...layer, count: 1024 }).roots;
  const expected = candidates
    .filter(
      ({ sequence, point: p }) =>
        humanFaceHairSequence(sequence, 13) <
        Math.exp(-0.5 * (16 * p.x * p.x + p.y * p.y + p.z * p.z)),
    )
    .slice(0, 64);
  TestValidator.equals("enough independent candidates", expected.length, 64);
  const unmasked = sample({ ...layer, count: 64 });
  const area = input.triangles.reduce((sum, triangle) => {
    const points = input.indices
      .slice(3 * triangle, 3 * triangle + 3)
      .map((id) =>
        Vector3.create(
          ...(input.positions.slice(3 * id, 3 * id + 3) as [
            number,
            number,
            number,
          ]),
        ),
      );
    return (
      sum +
      Vector3.length(
        Vector3.cross(
          Vector3.subtract(points[1], points[0]),
          Vector3.subtract(points[2], points[0]),
        ),
      ) /
        2
    );
  }, 0);
  TestValidator.predicate(
    "an unrejected population grows on its whole domain",
    nclose(unmasked.area, area),
  );
  layer.rootRegion = envelope;
  const population = sample({ ...layer, count: 64 });
  const roots = population.roots;
  TestValidator.equals("probability and unchanged seats", roots, expected);
  TestValidator.predicate(
    "rejection reports the smaller area it left",
    population.area > 0 && population.area < area / 2,
  );
  TestValidator.equals(
    "local prefix",
    sample({ ...layer, count: 16 }).roots,
    roots.slice(0, 16),
  );
  const moved = createHumanFaceHairRoots({
    ...input,
    positions: input.positions.map((value, at) => value + [2, -3, 4][at % 3]),
    origin: [2, -3, 4],
  })({
    ...layer,
    count: 64,
    rootRegion: { ...envelope, center: [2, -3, 4] },
  }).roots;
  TestValidator.equals(
    "translated sequence",
    moved.map((r) => r.sequence),
    roots.map((r) => r.sequence),
  );
  for (const [at, root] of moved.entries())
    TestValidator.equals(
      "translated barycentric weights",
      root.weights,
      roots[at].weights,
    );
  const hair = { layers: [{ ...layer, count: 0 }] };
  const before = JSON.stringify(hair);
  assertHumanFaceHair(hair);
  TestValidator.equals("input ownership", JSON.stringify(hair), before);
  for (const invalid of [
    { ...envelope, center: [NaN, 0, 0] },
    { ...envelope, spread: [0, 1, 1] },
    { ...envelope, spread: [-1, 1, 1] },
    { ...envelope, spread: [Infinity, 1, 1] },
  ])
    TestValidator.predicate(
      "invalid envelope refuses",
      throwsError(() =>
        assertHumanFaceHair({
          layers: [
            { ...hair.layers[0], rootRegion: invalid as typeof envelope },
          ],
        }),
      ),
    );
};
