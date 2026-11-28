import { AutoMovieEngineCurveGrid64, AutoMovieEngineCurveParentContext, AutoMovieEnginePchip64, AutoMovieEnginePchipField64, AutoMovieEngineCurve } from "@automovie/engine";
import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieCurveBoundaryEdge64,
  IAutoMovieCurveBoundary64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";
import { throwsError } from "../../internal/throwsError";

/**
 * Engine curve owners admit finite data and preserve caller isolation.
 *
 * Scenarios:
 *
 * 1. Scalar supports are snapshotted and scalar queries reject extrapolation.
 * 2. Vector supports are cloned and frozen while finite extrapolation remains
 *    supported.
 * 3. Curve grid and parametric atlas guards reject invalid sampling budgets.
 * 4. Primitive coefficients and complete boundary fullJ fields reject NaN.
 * 5. A context clones and freezes its publication and rejects copied tokens.
 * 6. Large finite geometry never publishes NaN normals after overflowed crosses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names snapshot ownership, extrapolation policy, numeric budget checks, boundary admission and finite output.
 * @evidence contracts/development/testing.md#behavioral-verification Calls PCHIP and curve owners before and after input mutation, then observes frozen copies, copied-token refusal and geometry under extreme finite input.
 * @evidence contracts/development/testing.md#independent-expectations The linear supports give independent exact samples and extrapolation. A copied boundary token has no owner identity. Nonfinite coefficients and invalid work limits violate their declared input domains.
 */
export function test_engine_geometry_curve_owners(): void {
  const xs: number[] = [0, 1, 2];
  const values: number[] = [0, 1, 2];
  const scalar: AutoMovieEnginePchip64 = new AutoMovieEnginePchip64(xs, values);
  xs[1] = 100;
  values[1] = 100;
  TestValidator.equals("scalar owns its supports", scalar.at(1), 1);
  TestValidator.predicate(
    "scalar rejects extrapolation",
    throwsError((): number => scalar.at(3)),
  );

  const fieldX: number[] = [0, 1];
  const fieldY: number[][] = [[0, 1, 2], [1, 2, 3]];
  const field: AutoMovieEnginePchipField64 = new AutoMovieEnginePchipField64(
    fieldX,
    fieldY,
  );
  fieldX[1] = 100;
  fieldY[1]![0] = 100;
  TestValidator.predicate(
    "field owns supports",
    field.at(1).every((value: number, i: number): boolean =>
      nclose(value, [1, 2, 3][i]!, 1e-12),
    ),
  );
  TestValidator.predicate(
    "field extrapolates",
    field.at(2).every((value: number, i: number): boolean =>
      nclose(value, [2, 3, 4][i]!, 1e-12),
    ),
  );
  TestValidator.predicate(
    "field snapshots are frozen copies",
    Object.isFrozen(field.x) &&
      Object.isFrozen(field.y) &&
      Object.isFrozen(field.y[0]) &&
      !Object.isFrozen(fieldX) &&
      !Object.isFrozen(fieldY),
  );

  const course = (z: number): IAutoMovieCubicBezierCurve64 => ({
    type: "cubicBezier",
    name: `course-${z}`,
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    spans: [[[0, 0, z], [1, 0, z], [2, 0, z], [3, 0, z]]],
  });
  const input: Parameters<typeof AutoMovieEngineCurveGrid64.tessellate>[0] = {
    name: "curve-grid",
    topologyDomain: "curve-grid-instance",
    stations: [0, 1],
    courses: [course(0), course(1)],
    resolutionMm: 1,
    guides: [0, 1],
    maxVertices: 128,
  };
  const result = AutoMovieEngineCurveGrid64.tessellate(input);
  TestValidator.predicate("grid generated", result.counts.vertices > 0);
  TestValidator.predicate(
    "grid rejects nonfinite sampling options",
    throwsError((): unknown =>
      AutoMovieEngineCurveGrid64.tessellate({ ...input, guides: [Number.NaN] }),
    ) &&
      throwsError((): unknown =>
        AutoMovieEngineCurveGrid64.tessellate({
          ...input,
          resolutionMm: Number.POSITIVE_INFINITY,
        }),
      ) &&
      throwsError((): unknown =>
        AutoMovieEngineCurveGrid64.tessellate({ ...input, maxVertices: 4.5 }),
      ) &&
      throwsError((): unknown =>
        AutoMovieEngineCurve.tessellateParametricAtlas64({
          domain: "empty-atlas",
          patches: [],
          maxVertices: Number.NaN,
        }),
      ) &&
      throwsError((): unknown =>
        AutoMovieEngineCurve.tessellateParametricAtlas64({
          domain: "empty-atlas",
          patches: [],
          maxVertices: Number.POSITIVE_INFINITY,
        }),
      ) &&
      throwsError((): unknown =>
        AutoMovieEngineCurve.tessellateParametricAtlas64({
          domain: "empty-atlas",
          patches: [],
          maxVertices: 1.5,
        }),
      ) &&
      throwsError((): unknown =>
        AutoMovieEngineCurve.tessellateParametricAtlas64({
          domain: "empty-atlas",
          patches: [],
          maxVertices: Number.MAX_SAFE_INTEGER + 1,
        }),
      ),
  );
  const largeCourse = (z: number): IAutoMovieCubicBezierCurve64 => ({
    ...course(z),
    spans: [
      [[0, 0, z], [1e200, 0, z], [2e200, 0, z], [3e200, 0, z]],
    ],
  });
  const large = AutoMovieEngineCurveGrid64.tessellate({
    ...input,
    courses: [largeCourse(0), largeCourse(1e200)],
    resolutionMm: 1e200,
  });
  TestValidator.predicate(
    "large finite coordinates do not produce NaN normals",
    large.counts.omittedZeroAreaTriangles > 0 &&
      large.mesh.normals?.every(Number.isFinite) === true,
  );

  const finite: IAutoMovieCubicBezierCurve64 = course(0);
  AutoMovieEngineCurve.assertCurve64(finite);
  TestValidator.predicate(
    "primitive rejects nonfinite positions",
    throwsError((): void =>
      AutoMovieEngineCurve.assertCurve64({
        ...finite,
        spans: [[[0, 0, 0], [1, 0, 0], [2, Number.NaN, 0], [3, 0, 0]]],
      }),
    ),
  );
  const boundary: IAutoMovieCurveBoundary64 = {
    id: "boundary",
    section: {
      ...course(0),
      name: "boundary",
      closed: true,
      phaseUnit: "turn",
    },
    fullJ: [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]],
    longitudinalUnit: "mm",
    longitudinalAxis: [0, 1, 0],
  };
  AutoMovieEngineCurve.assertCurveBoundary64(boundary);
  TestValidator.predicate(
    "boundary rejects nonfinite fullJ",
    throwsError((): void =>
      AutoMovieEngineCurve.assertCurveBoundary64({
        ...boundary,
        fullJ: [[[0, 0, 0], [0, Number.NaN, 0], [0, 0, 0], [0, 0, 0]]],
      }),
    ),
  );
  const frames: ConstructorParameters<
    typeof AutoMovieEngineCurveParentContext
  >[0] = [
    {
      bone: "root",
      parent: null,
      rotation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      translationMm: [0, 0, 0],
    },
    {
      bone: "child",
      parent: "root",
      rotation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      translationMm: [0, 0, 0],
    },
  ];
  const edge: IAutoMovieCurveBoundaryEdge64 = {
    id: "boundary",
    ownerRegion: "owner",
    ownerBone: "root",
    consumerRegion: "consumer",
    consumerBone: "child",
  };
  const context: AutoMovieEngineCurveParentContext =
    new AutoMovieEngineCurveParentContext(frames, [edge]);
  const publication = context.publish("owner", "root", boundary);
  const bound: IAutoMovieCurveBoundary64 = context.bind(
    "consumer",
    "child",
    publication,
  );
  TestValidator.predicate(
    "publication is a frozen owned clone",
    bound !== boundary &&
      Object.isFrozen(bound) &&
      Object.isFrozen(bound.section) &&
      Object.isFrozen(bound.section.spans[0]) &&
      Object.isFrozen(bound.section.spans[0]![0]) &&
      !Object.isFrozen(boundary) &&
      !Object.isFrozen(boundary.section) &&
      !Object.isFrozen(boundary.section.spans[0]),
  );
  TestValidator.predicate(
    "copied publication rejected",
    throwsError((): IAutoMovieCurveBoundary64 =>
      context.bind("consumer", "child", { ...publication }),
    ),
  );
}
