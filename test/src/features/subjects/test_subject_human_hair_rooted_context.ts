import { Vector3 } from "@automovie/engine";
import {
  growHumanFaceHairStrand,
  humanFaceHairContact,
  integrateHumanFaceHairCurve,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { throwsError } from "../internal/predicates";

/**
 * Required derived context refuses legacy/malformed callers before iteration.
 * Scenarios:
 * 1. Adjacent supported context completes; negative, fractional, NaN and infinite
 *    budgets refuse as invalid without mutation. Valid zero means exhaustion.
 * 2. Missing/noncallable ray, support and budget objects receive named context
 *    refusal, preserving the caller's existing count and geometry.
 * 3. A gathered lock cannot substitute a placement callback for tie completion;
 *    a legacy strand without completed rooted metadata refuses before resume.
 */
export const test_subject_human_hair_rooted_context = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [1, 0, 0];
  layer.lift.strength = 0;
  const root = Vector3.create(1, 0.5, 0.5);
  const props = {
    layer,
    root,
    reference: root,
    origin: Vector3.create(),
    normal: Vector3.create(1, 0, 0),
    sequence: 1,
    ...createNumericalHairCollider(createSignedVoxelUnion([[0, 0, 0]]), {
      triangle: 2,
      weights: [1, 0, 1],
    }),
  };
  const supported = integrateHumanFaceHairCurve(props);
  TestValidator.predicate(
    "supported context produces an explicit free boundary",
    supported.freeFrom >= 1,
  );
  for (const remaining of [-1, 0.5, NaN, Infinity]) {
    const budget = Object.freeze({ remaining });
    TestValidator.predicate(
      "malformed count has a named invalid refusal",
      throwsError(
        () => integrateHumanFaceHairCurve({ ...props, budget }),
        "nonnegative safe integer",
      ),
    );
    TestValidator.predicate(
      "invalid admission preserves count",
      Object.is(budget.remaining, remaining),
    );
  }
  TestValidator.predicate(
    "valid zero is exhaustion rather than invalid length",
    throwsError(
      () => integrateHumanFaceHairCurve({ ...props, budget: { remaining: 0 } }),
      "exhausted",
    ),
  );
  const invalid = [
    { raycaster: undefined },
    { raycaster: null },
    { raycaster: { nearestHit: undefined } },
    { rootBoundary: undefined },
    { rootBoundary: null },
    { rootBoundary: { ...props.rootBoundary, triangles: undefined } },
    { rootBoundary: { ...props.rootBoundary, distance: undefined } },
    { budget: undefined },
    { budget: null },
  ];
  for (const broken of invalid) {
    const before = props.budget.remaining;
    TestValidator.predicate(
      "legacy context has a named refusal",
      throwsError(
        () =>
          integrateHumanFaceHairCurve({
            ...props,
            ...broken,
          } as unknown as Parameters<typeof integrateHumanFaceHairCurve>[0]),
        "requires its current closed raycaster",
      ),
    );
    TestValidator.equals(
      "legacy refusal preserves count",
      props.budget.remaining,
      before,
    );
  }
  TestValidator.predicate(
    "gathering requires its own complete metric walk",
    throwsError(
      () =>
        integrateHumanFaceHairCurve({
          ...props,
          layer: {
            ...layer,
            gather: {
              anchor: { polar: 0, azimuth: 0 },
              radius: 0.005,
              strength: 1,
              tail: { direction: [0, 0, 1] },
            },
          },
          gatherAnchor: root,
          gatherDirection: () => Vector3.create(0, 1, 0),
          place: () => supported,
        }),
      "without hierarchy placement",
    ),
  );
  const contact = humanFaceHairContact({
    layer,
    root,
    length: supported.length,
    query: props.query,
  });
  const prefix = supported.points.slice(0, supported.freeFrom + 1);
  const rooted = {
    points: prefix,
    freeFrom: supported.freeFrom,
    travelled: prefix
      .slice(1)
      .reduce(
        (sum, point, at) =>
          sum + Vector3.length(Vector3.subtract(point, prefix[at])),
        0,
      ),
    targetLength: supported.length,
    clearance: supported.clearance,
    normal: supported.normal,
  };
  TestValidator.predicate(
    "adjacent valid rooted metadata remains usable",
    growHumanFaceHairStrand({
      strand: supported,
      contact,
      rooted,
      integrate: () => undefined,
    }) !== undefined,
  );
  let resumes = 0;
  const brokenRoots = [
    undefined,
    null,
    { ...rooted, points: undefined },
    { ...rooted, freeFrom: 0 },
    { ...rooted, freeFrom: 1.5 },
    { ...rooted, freeFrom: prefix.length },
    { ...rooted, travelled: NaN },
    { ...rooted, travelled: 0 },
    { ...rooted, targetLength: NaN },
    { ...rooted, targetLength: rooted.travelled / 2 },
    { ...rooted, clearance: NaN },
    { ...rooted, clearance: 0 },
    { ...rooted, normal: undefined },
    { ...rooted, normal: null },
    { ...rooted, normal: { ...rooted.normal, x: NaN } },
    { ...rooted, points: [undefined, ...prefix.slice(1)] },
    { ...rooted, points: [null, ...prefix.slice(1)] },
    { ...rooted, points: [{ ...prefix[0], x: NaN }, ...prefix.slice(1)] },
  ];
  for (const broken of brokenRoots)
    TestValidator.predicate(
      "legacy or malformed placement metadata refuses before resume",
      throwsError(
        () =>
          growHumanFaceHairStrand({
            strand: supported,
            contact,
            rooted: broken,
            integrate: () => {
              resumes++;
              return undefined;
            },
          } as unknown as Parameters<typeof growHumanFaceHairStrand>[0]),
        "canonical rooted transition metadata",
      ),
    );
  TestValidator.equals("legacy metadata never resumes", resumes, 0);
  for (const length of [NaN, Infinity, 0])
    TestValidator.predicate(
      "derived metric refuses nonfinite or nonpositive length",
      throwsError(
        () =>
          integrateHumanFaceHairCurve({
            ...props,
            metric: { length, contact },
          }),
        "rooted transition",
      ),
    );
};
