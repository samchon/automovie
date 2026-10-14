import { solveBallisticLaunch, solveMovingLaunch } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Ballistic solvers work on world vectors. Non-finite coordinates must reject
 * the solve before vector normalization/range math can emit `NaN` components.
 *
 * Scenarios:
 *
 * 1. Static and moving launch solvers return null for non-finite origin, target and gravity coordinates, including a target that becomes invalid after its first evaluation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the static and moving solvers with non-finite vector components and requires null, preventing normalization from publishing NaN launch state.
 * @evidence contracts/testing.md#independent-expectations Finite world vectors are the input contract; authored invalid components establish refusal without consulting a numeric implementation oracle. This is not an exhaustive axis permutation test.
 * @evidence contracts/testing.md#distinguishing-cases Separates origin, target and gravity failures and initial versus iterated moving-target failure; finite launches and invalid speed belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported unit entry invokes portable solvers and local callbacks directly, without real hosts or dynamically registered cases.
 */
export function test_physics_ballistic_non_finite_vectors(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const target: IAutoMovieVector3 = { x: 8, y: 1, z: 0 };
  const gravity: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

  TestValidator.predicate(
    "static origin x nan is null",
    solveBallisticLaunch({ x: Number.NaN, y: 1, z: 0 }, target, 10) === null,
  );
  TestValidator.predicate(
    "static target y infinite is null",
    solveBallisticLaunch(origin, { x: 8, y: Infinity, z: 0 }, 10) === null,
  );
  TestValidator.predicate(
    "static gravity z nan is null",
    solveBallisticLaunch(origin, target, 10, {
      x: 0,
      y: -9.81,
      z: Number.NaN,
    }) === null,
  );

  TestValidator.predicate(
    "moving origin x nan is null",
    solveMovingLaunch(
      { x: Number.NaN, y: 1, z: 0 },
      (): IAutoMovieVector3 => target,
      10,
    ) === null,
  );
  TestValidator.predicate(
    "moving gravity z nan is null",
    solveMovingLaunch(origin, (): IAutoMovieVector3 => target, 10, {
      x: 0,
      y: -9.81,
      z: Number.NaN,
    }) === null,
  );
  TestValidator.predicate(
    "moving initial target y infinite is null",
    solveMovingLaunch(
      origin,
      (): IAutoMovieVector3 => ({ x: 8, y: Infinity, z: 0 }),
      10,
    ) === null,
  );
  TestValidator.predicate(
    "moving iterated target x nan is null",
    solveMovingLaunch(
      origin,
      (t: number): IAutoMovieVector3 =>
        t === 0 ? target : { x: Number.NaN, y: 1, z: 0 },
      10,
      gravity,
    ) === null,
  );
}
