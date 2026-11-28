import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasTessellation64,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieLocalHermiteStream64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Bicubic planners admit finite work limits and diagnose unrepresentable
 * second-derivative bounds before subdivision.
 *
 * Scenarios:
 *
 * 1. The same affine patch in atlas and Hermite form qualifies with one cell.
 * 2. A large finite translation overflows the existing derivative stencil. Neither
 *    planner treats the arithmetic refusal as exhausted work.
 * 3. Infinite tolerances, fractional cell caps, NaN chunk caps and unsafe initial
 *    indices refuse at admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the affine witness, the distinct derivative arithmetic failure and the invalid work policies.
 * @evidence contracts/development/testing.md#behavioral-verification Drains the public atlas generator to observe its summary and invokes the real Hermite plan from admitted courses. Queries malformed work policies through both entry points.
 * @evidence contracts/development/testing.md#independent-expectations An affine grid needs no split because its second derivatives vanish. Doubling the finite translation two to the power 1023 overflows in the derivative stencil. Its refusal differs from an exhausted budget. The limit matrix contradicts the finite positive and safe integer requirements.
 */
export function test_engine_geometry_bicubic_bound_admission(): void {
  const atlas = (x: number): IAutoMovieBicubicAtlasTessellation64.Input => ({
    topologyDomain: "finite-bound-atlas",
    controlsMm: Array.from(
      { length: 16 },
      (_, index): AutoMovieVector3Tuple => [
        x,
        Math.floor(index / 4),
        index % 4,
      ],
    ),
    patches: [
      {
        id: "plane",
        controlIds: Array.from({ length: 16 }, (_, index) => index),
      },
    ],
    toleranceMm: 0.01,
    maxCells: 1,
    maxVerticesPerChunk: 4,
  });
  const hermite = (x: number): IAutoMovieLocalHermiteStream64.Input => {
    const course = (y: number): IAutoMovieCubicBezierCurve64 => ({
      type: "cubicBezier",
      name: `course-${y}`,
      closed: false,
      unit: "mm",
      phaseUnit: "normalized",
      phaseIntervals: [1],
      spans: [
        [
          [x, y, 0],
          [x, y, 1],
          [x, y, 2],
          [x, y, 3],
        ],
      ],
    });
    return {
      name: "finite-bound-hermite",
      topologyDomain: "finite-bound-hermite",
      stations: [0, 3],
      courses: [course(0), course(3)],
      toleranceMm: 0.01,
      maxCellsPerInterval: 1,
      maxVerticesPerChunk: 4,
      stationInterpolation: "ruled",
    };
  };
  const summarizeAtlas = (
    input: IAutoMovieBicubicAtlasTessellation64.Input,
  ): IAutoMovieBicubicAtlasTessellation64.Summary => {
    const stream = AutoMovieEngineCurve.tessellateBicubicAtlas64(input);
    let next = stream.next();
    while (!next.done) next = stream.next();
    return next.value;
  };

  TestValidator.equals(
    "affine atlas diagnostics",
    summarizeAtlas(atlas(0)).diagnostics,
    [],
  );
  TestValidator.equals(
    "affine Hermite leaf count",
    AutoMovieEngineCurve.planLocalHermite64(hermite(0)).plan(0).leaves.length,
    1,
  );

  const extreme: number = 2 ** 1023;
  const diagnostic: string = "nonfinite tensor derivative estimate";
  const misses: string[] = [];
  if (
    !summarizeAtlas(atlas(extreme)).diagnostics.some((message) =>
      message.includes(diagnostic),
    )
  )
    misses.push("atlas derivative overflow");
  const interval = AutoMovieEngineCurve.planLocalHermite64(
    hermite(extreme),
  ).plan(0);
  if (
    interval.reason !== `arithmetic-unprocessed: ${diagnostic}` ||
    interval.leaves.length
  )
    misses.push(`Hermite derivative overflow: ${interval.reason}`);

  const invalidPolicies = [
    [{ toleranceMm: Infinity }, { toleranceMm: Infinity }],
    [{ maxCells: 1.5 }, { maxCellsPerInterval: 1.5 }],
    [{ maxVerticesPerChunk: Number.NaN }, { maxVerticesPerChunk: Number.NaN }],
    [{ vertexOffset: 2 ** 53 }, { vertexOffset: 2 ** 53 }],
  ] as const;
  for (const [
    index,
    [atlasPolicy, hermitePolicy],
  ] of invalidPolicies.entries()) {
    if (
      !throwsError(
        () => summarizeAtlas({ ...atlas(0), ...atlasPolicy }),
        "safe atlas budgets",
      )
    )
      misses.push(`atlas policy ${index}`);
    if (
      !throwsError(
        () =>
          AutoMovieEngineCurve.planLocalHermite64({
            ...hermite(0),
            ...hermitePolicy,
          }),
        "safe resource budgets",
      )
    )
      misses.push(`Hermite policy ${index}`);
  }
  TestValidator.equals("admission and arithmetic receipts", misses, []);
}
