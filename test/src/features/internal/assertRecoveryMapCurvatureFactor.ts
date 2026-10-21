import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import { createRecoveryMapTriangularMetric } from "../../../../packages/recovery/src/internal/createRecoveryMapTriangularMetric";
import { differentiateRecoveryMapProjection } from "../../../../packages/recovery/src/internal/differentiateRecoveryMapProjection";
import { factorRecoveryMapCurvature } from "../../../../packages/recovery/src/internal/factorRecoveryMapCurvature";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryMapCurvatureBlocks } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapCurvatureBlocks";
import type { IAutoMovieRecoveryMapCurvatureFit } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapCurvatureFit";
import { nclose } from "../internal/nclose";

/**
 * The lagged-curvature entry owns independent factor and ownership cases.
 *
 * Scenarios:
 * 1. An authored offdiagonal eight-coordinate upper factor and nonunit scales define an independent dense physical quadratic and covector duality.
 * 2. Point, camera and fixed-row arithmetic refusals precede a distinct post-return inverse overflow.
 * 3. Malformed rows, scales, factors and chart holes throw even when a later pivot would refuse optional arithmetic.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises factor construction, whitening and both triangular actions plus chart ownership through their actual source functions.
 * @evidence contracts/testing.md#independent-expectations The separately authored upper factor defines dense R-transpose-R and physical D scaling; explicit malformed counts and stage reasons distinguish ownership from arithmetic absence.
 * @evidence contracts/testing.md#distinguishing-cases Includes offdiagonal coupling, nonunit D, indefinite point and Schur blocks, finite overflow, sparse holes and error precedence. The calling entry owns local derivative values, assembly, seed copying and actual camera lifecycle cases.
 * @evidence contracts/testing.md#execution-ownership Called once by portable test_recovery_lagged_curvature in its existing sequence. It has no discoverable test entry or process, filesystem, image or GPU access and retains no borrowed chart input after return.
 */
export function assertRecoveryMapCurvatureFactor(
  pose: IAutoMovieRecoveryMapPose,
  seedPose: IAutoMovieRecoveryMapPose,
  point: [number, number, number],
  intrinsic: number[],
): void {
  const upper: number[][] = [
    [2, 0.2, 0.1, 0.4, -0.3],
    [0, 1.5, -0.1, -0.2, 0.3],
    [0, 0, 1.2, 0.1, 0.2],
    [1.7, -0.3, 0.2, -0.1, 0.25],
    [0, 1.3, 0.1, 0.35, -0.1],
    [0, 0, 1.1, -0.2, 0.15],
    [1.8, 0.3],
    [0, 1.4],
  ];
  const scales: number[] = [2, 3, 1, 4, 2, 3, 2, 5];
  const dense: number[][] = Array.from({ length: 8 }, (): number[] =>
    new Array<number>(8).fill(0),
  );
  for (let row: number = 0; row < 8; row++) {
    const full: number[] = new Array<number>(8).fill(0);
    if (row < 6) {
      const which: number = Math.floor(row / 3);
      for (let axis: number = 0; axis < 3; axis++)
        full[2 + 3 * which + axis] = upper[row]![axis]!;
      full[0] = upper[row]![3]!;
      full[1] = upper[row]![4]!;
    } else {
      full[0] = upper[row]![0]!;
      full[1] = upper[row]![1]!;
    }
    for (let axis: number = 0; axis < 8; axis++)
      for (let other: number = 0; other < 8; other++)
        dense[axis]![other]! += full[axis]! * full[other]!;
  }
  const blocks: IAutoMovieRecoveryMapCurvatureBlocks = {
    camera: dense.slice(0, 2).map((row: number[]): number[] => row.slice(0, 2)),
    points: [0, 1].map((which: number): number[][] =>
      [0, 1, 2].map((axis: number): number[] => [
        ...dense[2 + 3 * which + axis]!.slice(2 + 3 * which, 5 + 3 * which),
        ...dense[2 + 3 * which + axis]!.slice(0, 2),
      ]),
    ),
  };
  const rows: IAutoMovieSimplexAtom[] = [
    {
      indices: [0, 1, 2, 3, 4, 5, 6, 7],
      values: [1, -2, 3, 0.5, -0.2, 1, 0.4, -0.8],
      offset: 0,
    },
    { indices: [0, 1, 5, 6, 7], values: [-0.3, 1, 0.2, -0.1, 0.4], offset: 1 },
  ];
  const factored: IAutoMovieRecoveryMapCurvatureFit =
    factorRecoveryMapCurvature(
      structuredClone(blocks),
      scales.slice(0, 2),
      [scales.slice(2, 5), scales.slice(5)],
      rows,
    );
  TestValidator.predicate(
    "authored offdiagonal arrowhead supports complete fixed rows",
    factored.metric !== null &&
      factored.rows !== null &&
      factored.reason === null,
  );
  const z: number[] = [0.2, -0.1, 0.3, -0.4, 0.5, -0.2, 0.1, 0.6];
  const physical: number[] = factored.metric!.unwhiten(z);
  const product: number[] = dense.map((row: number[], axis: number): number =>
    row.reduce(
      (sum: number, value: number, other: number): number =>
        sum + scales[axis]! * value * scales[other]! * physical[other]!,
      0,
    ),
  );
  const pushed: number[] = factored.metric!.toPhysicalCovector(z);
  const norm: number = physical.reduce(
    (sum: number, value: number, axis: number): number =>
      sum + value * product[axis]!,
    0,
  );
  TestValidator.predicate(
    "independent dense physical norm and transpose product",
    nclose(
      norm,
      z.reduce((sum: number, value: number): number => sum + value * value, 0),
      1e-12,
    ) &&
      pushed.every((value: number, axis: number): boolean =>
        nclose(value, product[axis]!, 1e-12),
      ) &&
      rows.every((row: IAutoMovieSimplexAtom, at: number): boolean =>
        nclose(
          row.indices.reduce(
            (sum: number, axis: number, entry: number): number =>
              sum + row.values[entry]! * physical[axis]!,
            0,
          ),
          factored.rows![at]!.indices.reduce(
            (sum: number, axis: number, entry: number): number =>
              sum + factored.rows![at]!.values[entry]! * z[axis]!,
            0,
          ),
          1e-12,
        ),
      ),
  );
  const pointBad: IAutoMovieRecoveryMapCurvatureBlocks =
      structuredClone(blocks),
    cameraBad: IAutoMovieRecoveryMapCurvatureBlocks = structuredClone(blocks);
  pointBad.points[0]![0]![0] = -1;
  cameraBad.camera[0]![0] = -1e6;
  const tiny: IAutoMovieRecoveryMapCurvatureBlocks = {
    camera: [[1]],
    points: [
      [
        [1e-300, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
      ],
    ],
  };
  const late: IAutoMovieRecoveryMapCurvatureFit = factorRecoveryMapCurvature(
    structuredClone(tiny),
    [1],
    [[1, 1, 1]],
    [],
  );
  let lateError: boolean = false;
  try {
    late.metric!.unwhiten([0, Number.MAX_VALUE, 0, 0]);
  } catch {
    lateError = true;
  }
  TestValidator.predicate(
    "pre-return refusal stages and post-return action error differ",
    factorRecoveryMapCurvature(
      pointBad,
      scales.slice(0, 2),
      [scales.slice(2, 5), scales.slice(5)],
      rows,
    ).reason === "point-pivot" &&
      factorRecoveryMapCurvature(
        cameraBad,
        scales.slice(0, 2),
        [scales.slice(2, 5), scales.slice(5)],
        rows,
      ).reason === "camera-pivot" &&
      factorRecoveryMapCurvature(
        structuredClone(tiny),
        [1],
        [[1, 1, 1]],
        [{ indices: [1], values: [Number.MAX_VALUE], offset: 0 }],
      ).reason === "row-whitening" &&
      late.metric !== null &&
      lateError,
  );
  const malformedRows: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [], offset: 0 },
    { indices: [-1], values: [1], offset: 0 },
    { indices: [0, 0], values: [1, 1], offset: 0 },
    { indices: [4], values: [1], offset: 0 },
    { indices: [0], values: [Number.NaN], offset: 0 },
    { indices: [0], values: [1], offset: Infinity },
  ];
  let ownershipErrors: number = 0;
  for (const row of malformedRows)
    try {
      factorRecoveryMapCurvature(
        structuredClone(tiny),
        [1],
        [[1, 1, 1]],
        [row],
      );
    } catch {
      ownershipErrors++;
    }
  for (const pointScale of [
    [1, 1],
    [0, 1, 1],
    [Infinity, 1, 1],
  ])
    try {
      factorRecoveryMapCurvature(structuredClone(tiny), [1], [pointScale], []);
    } catch {
      ownershipErrors++;
    }
  try {
    const bad: IAutoMovieRecoveryMapCurvatureBlocks = structuredClone(tiny);
    bad.points[0]![0]![0] = -1;
    factorRecoveryMapCurvature(bad, [1], [[1, 1, 1]], [malformedRows[0]!]);
  } catch {
    ownershipErrors++;
  }
  try {
    createRecoveryMapTriangularMetric(
      tiny.points,
      [[Number.NaN]],
      [[1, 1, 1]],
      [1],
    );
  } catch {
    ownershipErrors++;
  }
  TestValidator.predicate(
    "malformed ownership precedes optional arithmetic refusal",
    ownershipErrors === 11,
  );
  let holesRejected: number = 0;
  const badPivot: IAutoMovieRecoveryMapCurvatureBlocks = structuredClone(tiny);
  badPivot.points[0]![0]![0] = -1;
  for (const pointScale of [new Array<number>(3)])
    try {
      factorRecoveryMapCurvature(
        structuredClone(badPivot),
        [1],
        [pointScale],
        [],
      );
    } catch {
      holesRejected++;
    }
  try {
    factorRecoveryMapCurvature(
      structuredClone(badPivot),
      new Array<number>(1),
      [[1, 1, 1]],
      [],
    );
  } catch {
    holesRejected++;
  }
  try {
    factorRecoveryMapCurvature(
      structuredClone(badPivot),
      [1],
      new Array<number[]>(1),
      [],
    );
  } catch {
    holesRejected++;
  }
  try {
    createRecoveryMapTriangularMetric(
      tiny.points,
      [new Array<number>(1)],
      [[1, 1, 1]],
      [1],
    );
  } catch {
    holesRejected++;
  }
  try {
    createRecoveryMapTriangularMetric(
      [new Array<number[]>(3)],
      [[1]],
      [[1, 1, 1]],
      [1],
    );
  } catch {
    holesRejected++;
  }
  try {
    differentiateRecoveryMapProjection(
      { ...pose, rotation: new Array<number>(9) },
      point,
      intrinsic,
      [],
    );
  } catch {
    holesRejected++;
  }
  try {
    differentiateRecoveryMapProjection(pose, point, new Array<number>(9), []);
  } catch {
    holesRejected++;
  }
  try {
    differentiateRecoveryMapProjection(
      seedPose,
      point,
      intrinsic,
      new Array<[number, number, number]>(2),
    );
  } catch {
    holesRejected++;
  }
  try {
    const bad: IAutoMovieRecoveryMapCurvatureBlocks = structuredClone(badPivot);
    bad.camera[0] = new Array<number>(1);
    factorRecoveryMapCurvature(bad, [1], [[1, 1, 1]], []);
  } catch {
    holesRejected++;
  }
  try {
    const bad: IAutoMovieRecoveryMapCurvatureBlocks = structuredClone(badPivot);
    bad.points[0]![1] = new Array<number>(4);
    factorRecoveryMapCurvature(bad, [1], [[1, 1, 1]], []);
  } catch {
    holesRejected++;
  }
  TestValidator.predicate(
    "indexed ownership checks visit sparse holes before optional arithmetic",
    holesRejected === 10,
  );
}
