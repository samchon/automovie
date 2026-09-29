import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import { integrateHumanFaceHairCurve } from "@automovie/human/face/anatomy/hair/integrateHumanFaceHairCurve";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { nclose } from "../internal/predicates";

/**
 * A free step is certified from the signed distance already read at its source;
 * a scalp-following step keeps the projector because the bound is insufficient.
 * Scenarios:
 * 1. A 50 mm outward lock above a planar surface skips the redundant next-step
 *    queries yet retains its metric length and the same station spacing.
 * 2. A tangential lock beside that surface still queries its next-step
 *    projection, keeping the requested contact clearance.
 */
export const test_subject_human_hair_free_step = (): void => {
  const root = Vector3.create(1, 0.5, 0.5);
  const make = (flow: [number, number, number]) => {
    let queries = 0;
    const query: ReturnType<typeof createAutoMovieSignedMeshQuery> = (
      point,
    ) => {
      queries++;
      return {
        point: [1, point[1], point[2]],
        normal: [1, 0, 0],
        distance: Math.abs(point[0] - 1),
        signedDistance: point[0] - 1,
        triangle: 0,
        feature: "face",
        boundary: false,
      };
    };
    const layer = createNumericalHairFixture().layers[0];
    layer.flow = flow;
    layer.lift.strength = 0;
    const curve = integrateHumanFaceHairCurve({
      layer,
      origin: Vector3.create(),
      reference: root,
      root,
      normal: Vector3.create(1, 0, 0),
      sequence: 1,
      query,
    });
    return { curve, queries, layer };
  };
  const free = make([1, 0, 0]);
  const length = free.curve.points
    .slice(1)
    .reduce(
      (total, point, at) =>
        total + Vector3.length(Vector3.subtract(point, free.curve.points[at])),
      0,
    );
  TestValidator.predicate(
    "free curve retains authored length",
    nclose(length, 0.05, 1e-12),
  );
  TestValidator.predicate(
    "free chords retain the admitted step",
    free.curve.points
      .slice(2)
      .every(
        (point, at) =>
          Vector3.length(Vector3.subtract(point, free.curve.points[at + 1])) <=
          free.layer.samplingStep + 1e-12,
      ),
  );
  TestValidator.predicate(
    "one known distance serves the following free step",
    free.queries <= free.curve.points.length + 4,
  );
  const near = make([0, 1, 0]);
  TestValidator.predicate(
    "scalp-following stations still project",
    near.queries >= 2 * (near.curve.points.length - 2),
  );
  TestValidator.predicate(
    "tangential curve holds its skin clearance",
    near.curve.points
      .slice(1)
      .every((point) => point.x - 1 >= near.layer.clearance - 1e-12),
  );
};
