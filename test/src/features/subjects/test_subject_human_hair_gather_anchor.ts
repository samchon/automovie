import { Vector3 } from "@automovie/engine";
import { resolveHumanFaceHairGatherAnchor } from "@automovie/human/face/anatomy/hair/resolveHumanFaceHairGatherAnchor";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * A tie uses one neutral scalp ray and the same triangle on a shaped head.
 * Scenarios:
 * 1. An analytic cube's crown and side rays hit the expected metric points;
 *    stretching its current surface carries the point by fixed barycentric
 *    correspondence without moving the source.
 * 2. A growth region that does not contain the outward ray refuses instead of
 *    snapping the tie to a different surface.
 */
export const test_subject_human_hair_gather_anchor = (): void => {
  const cube = createSignedVoxelUnion([[0, 0, 0]]);
  const original = cube.positions.slice();
  const triangles = Array.from(
    { length: cube.indices!.length / 3 },
    (_, index) => index,
  );
  const props = {
    origin: Vector3.create(0.5, 0.5, 0.5),
    positions: cube.positions,
    current: cube.positions.map((value, at) =>
      at % 3 === 1 ? value + 1 : value,
    ),
    indices: cube.indices!,
    triangles,
    polar: 0,
    azimuth: 0,
  };
  const top = resolveHumanFaceHairGatherAnchor(props);
  TestValidator.predicate(
    "neutral crown follows current scalp",
    vclose(top.point, Vector3.create(0.5, 2, 0.5)) &&
      nclose(
        top.weights.reduce((sum, value) => sum + value, 0),
        1,
      ),
  );
  const side = resolveHumanFaceHairGatherAnchor({
    ...props,
    polar: Math.PI / 2,
    azimuth: Math.PI / 2,
  });
  TestValidator.predicate(
    "azimuth points to anatomical left",
    vclose(side.point, Vector3.create(1, 1.5, 0.5)),
  );
  TestValidator.predicate(
    "source buffer remains unchanged",
    props.positions.every((value, at) => value === original[at]),
  );
  const topOnly = triangles.filter((triangle) => {
    const ids = props.indices.slice(3 * triangle, 3 * triangle + 3);
    return ids.every((id) => props.positions[3 * id + 1] === 1);
  });
  TestValidator.predicate("analytic region is present", topOnly.length === 2);
  TestValidator.predicate(
    "ray outside the growth region refuses",
    throwsError(
      () =>
        resolveHumanFaceHairGatherAnchor({
          ...props,
          triangles: topOnly,
          polar: Math.PI,
        }),
      "must meet its shared scalp domain",
    ),
  );
};
