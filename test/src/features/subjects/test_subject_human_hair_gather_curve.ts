import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { integrateHumanFaceHairCurve } from "@automovie/human/face/anatomy/hair/integrateHumanFaceHairCurve";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A gathered lock reaches its scalp tie before a distinct tail direction.
 * Scenarios:
 * 1. On an analytic cube the tie is entered within the authored radius, the
 *    tail then turns while retaining metric length and surface clearance.
 * 2. A missing attached field, a too-short lock and a root already inside the
 *    tie exercise the refusal and both stage entry paths.
 */
export const test_subject_human_hair_gather_curve = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [0, 1, 0];
  layer.lift.strength = 0;
  layer.lengthAxes = [0.12, 0.12, 0.12, 0.12, 0.12, 0.12];
  layer.gather = {
    anchor: { polar: Math.PI / 2, azimuth: Math.PI / 2 },
    radius: 0.005,
    strength: 1,
    tail: { direction: [0, 0, 1] },
  };
  const root = Vector3.create(1, 0.5, 0.5);
  const anchor = Vector3.create(1, 0.55, 0.5);
  const props = {
    layer,
    origin: Vector3.create(),
    reference: root,
    root,
    normal: Vector3.create(1, 0, 0),
    sequence: 1,
    query: createAutoMovieSignedMeshQuery(createSignedVoxelUnion([[0, 0, 0]])),
    gatherAnchor: anchor,
    gatherDirection: () => Vector3.create(0, 1, 0),
  };
  const curve = integrateHumanFaceHairCurve(props);
  TestValidator.predicate(
    "lock enters a single tie and grows a tail",
    nclose(curve.length, 0.12) &&
      curve.points.some((point) =>
        nclose(
          Vector3.length(Vector3.subtract(point, anchor)),
          layer.gather!.radius,
        ),
      ) &&
      curve.points[curve.points.length - 1].z > root.z,
  );
  const volume = structuredClone(layer);
  volume.gather!.tail.spread = { radius: 0.03, reach: 0.03 };
  const widened = integrateHumanFaceHairCurve({ ...props, layer: volume });
  TestValidator.predicate(
    "tail cross-section expands after the same tie",
    widened.points[widened.points.length - 1].x >
      curve.points[curve.points.length - 1].x + 0.001 &&
      nclose(widened.length, curve.length),
  );
  TestValidator.predicate(
    "missing attached field refuses",
    throwsError(
      () =>
        integrateHumanFaceHairCurve({ ...props, gatherDirection: undefined }),
      "attached scalp anchor",
    ),
  );
  const short = structuredClone(layer);
  short.lengthAxes = [0.02, 0.02, 0.02, 0.02, 0.02, 0.02];
  TestValidator.predicate(
    "short lock cannot pretend to be gathered",
    throwsError(
      () => integrateHumanFaceHairCurve({ ...props, layer: short }),
      "before it reached its scalp tie",
    ),
  );
  const fromTie = integrateHumanFaceHairCurve({
    ...props,
    gatherAnchor: root,
    gatherDirection: () => {
      throw new Error("The initial tie must not request the scalp field.");
    },
  });
  TestValidator.predicate(
    "root inside the tie starts its tail directly",
    fromTie.points[fromTie.points.length - 1].z > root.z &&
      nclose(fromTie.length, 0.12),
  );
};
