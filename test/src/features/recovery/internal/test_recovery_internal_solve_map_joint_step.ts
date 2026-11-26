import { AutoMovieEngineMath } from "@automovie/engine";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoverySceneNumericalFixture } from "../../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../../internal/nclose";

/**
 * Variable-width point elimination preserves the complete original design.
 *
 * Scenarios:
 *
 * 1. Seventeen camera coordinates and four observations per point exceed both
 *    previous triad limits; zero/damped steps match an independently assembled
 *    full-design solve in every coordinate.
 * 2. An unobserved camera direction or undersized original-design budget refuses
 *    before damping can manufacture rank.
 */
export function test_recovery_internal_solve_map_joint_step(): void {
  const budget: ReturnType<
    typeof createRecoverySceneNumericalFixture
  >["input"]["budget"] = createRecoverySceneNumericalFixture().input.budget;
  let state: number = 31;
  const random: () => number = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000 - 0.5;
  };
  const cameraWidth: number = 17;
  const blocks: Parameters<typeof AutoMovieRecoveryCameraMap.solveMapJointStep>[0] = Array.from(
    { length: 8 },
    (): Parameters<typeof AutoMovieRecoveryCameraMap.solveMapJointStep>[0][number] => ({
      pointRows: Array.from({ length: 8 }, (): number[] =>
        Array.from({ length: 3 }, random),
      ),
      cameraRows: Array.from({ length: 8 }, (): number[] =>
        Array.from({ length: cameraWidth }, random),
      ),
      right: Array.from({ length: 8 }, random),
    }),
  );
  for (const damping of [0, 0.03]) {
    const actual: ReturnType<typeof AutoMovieRecoveryCameraMap.solveMapJointStep> =
      AutoMovieRecoveryCameraMap.solveMapJointStep(blocks, 1e-8, damping, budget);
    const width: number = cameraWidth + 3 * blocks.length;
    const rows: number[][] = [],
      right: number[] = [];
    for (let point: number = 0; point < blocks.length; point++)
      for (let row: number = 0; row < blocks[point]!.right.length; row++) {
        const values: number[] = new Array<number>(width).fill(0);
        for (let column: number = 0; column < cameraWidth; column++)
          values[column] = blocks[point]!.cameraRows[row]![column]!;
        for (let column: number = 0; column < 3; column++)
          values[cameraWidth + 3 * point + column] =
            blocks[point]!.pointRows[row]![column]!;
        rows.push(values);
        right.push(blocks[point]!.right[row]!);
      }
    const scales: number[] = Array.from(
      { length: width },
      (_: unknown, column: number): number =>
        rows.reduce(
          (norm: number, row: number[]): number =>
            Math.hypot(norm, row[column]!),
          0,
        ),
    );
    const normalized: number[][] = rows.map((row: number[]): number[] =>
      row.map((value: number, at: number): number => value / scales[at]!),
    );
    if (damping > 0)
      for (let row: number = 0; row < width; row++) {
        normalized.push(
          Array.from({ length: width }, (_: unknown, column: number): number =>
            row === column ? Math.sqrt(damping) : 0,
          ),
        );
        right.push(0);
      }
    const factors: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
      AutoMovieEngineMath.decomposeSingularMatrix(normalized, {
        maxEntries: budget.maxLinearEntries,
        maxSweeps: 128,
        orthogonalityTolerance: 1e-12,
      });
    const expected: number[] = new Array<number>(width).fill(0);
    for (let component: number = 0; component < width; component++) {
      const coefficient: number =
        right.reduce(
          (sum: number, value: number, at: number): number =>
            sum + value * factors.leftColumns[component]![at]!,
          0,
        ) / factors.singularValues[component]!;
      for (let column: number = 0; column < width; column++)
        expected[column] +=
          (coefficient * factors.rightColumns[component]![column]!) /
          scales[column]!;
    }
    const observed: number[] = [
      ...actual.cameraStep,
      ...actual.pointSteps.flat(),
    ];
    TestValidator.predicate(
      "general-width block and camera QR equal full original solve",
      expected.every((value: number, at: number): boolean =>
        nclose(value, observed[at]!, 1e-7),
      ),
    );
  }
  const missing: Parameters<typeof AutoMovieRecoveryCameraMap.solveMapJointStep>[0] = blocks.map(
    (block: (typeof blocks)[number]): (typeof blocks)[number] => ({
      ...block,
      cameraRows: block.cameraRows.map((row: number[]): number[] =>
        row.map((value: number, column: number): number =>
          column === 16 ? 0 : value,
        ),
      ),
    }),
  );
  for (const action of [
    (): unknown => AutoMovieRecoveryCameraMap.solveMapJointStep(missing, 1e-8, 1, budget),
    (): unknown =>
      AutoMovieRecoveryCameraMap.solveMapJointStep(blocks, 1e-8, 1, {
        ...budget,
        maxLinearEntries: 1000,
      }),
  ]) {
    let refused: boolean = false;
    try {
      action();
    } catch {
      refused = true;
    }
    TestValidator.predicate(
      "unobservable or over-budget steps refuse before damping",
      refused,
    );
  }
}
