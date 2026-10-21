import { TestValidator } from "@nestia/e2e";

import { refineRecoveryFeasibleState } from "../../../../packages/recovery/src/internal/refineRecoveryFeasibleState";
import type { IAutoMovieRecoveryFeasibleModel } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";
import type { IAutoMovieRecoveryUntiltedEstimate } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryUntiltedEstimate";
import { nclose } from "../internal/nclose";

/**
 * Requested affine estimates belong to the selected precommit notification.
 *
 * Scenarios:
 * 1. An inactive original inequality gives a qualified empty untilted estimate, even when the earlier T candidate wins a tie.
 * 2. A remaining-one trial has no auxiliary estimate and supplies null; an absent request preserves four callback arguments and its previous work.
 * 3. Initial KKT and refused trials make no notification. A true request without an owner refuses before evaluation.
 * 4. Wrapper charge and callback marker errors propagate before a second model or committed notification can occur.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real generic direction, Arc and selector through a one-coordinate physical quadratic; observes callback argument count, original row metadata, null versus empty and fixed precommit charging.
 * @evidence contracts/testing.md#independent-expectations F=(x-.1)^2/2 and g=x-1 give an interior affine minimizer .1 with zero constraint dual. A horizon of one skips Arc by contract, while a requested selected update adds exactly32 generic visits to the otherwise identical absent-request run.
 * @evidence contracts/testing.md#distinguishing-cases Separates selected T from auxiliary qualification, qualified empty from unavailable null, absent from requested reactions, initial KKT/refusal from updates, and original charge/callback errors. Camera-owned copying, chart derivatives and curvature factors have separate tests.
 * @evidence contracts/testing.md#execution-ownership Portable test_recovery_feasible_estimate uses source routines and resident authored arrays without filesystem, process, compiler, installation, image, browser or GPU.
 */
export function test_recovery_feasible_estimate(): void {
  let argumentsCount: number = 0,
    notifications: number = 0,
    evaluations: number = 0;
  let estimateState: number = 0,
    estimateWidth: number = 0,
    estimateRows: number = 0;
  let selectedCount: number = 0,
    multiplierCount: number = 0;
  const problem: IAutoMovieRecoveryFeasibleProblem<number> = {
    initial: 0,
    evaluate: (x: number): number => {
      evaluations++;
      return (x - 0.1) ** 2 / 2;
    },
    linearize: (x: number): IAutoMovieRecoveryFeasibleModel => ({
      width: 1,
      rows: [
        { indices: [0], values: [x - 0.1], offset: 0 },
        { indices: [0], values: [1], offset: 1 - x },
      ],
      physicalRows: [
        { indices: [0], values: [x - 0.1], offset: 0 },
        { indices: [0], values: [1], offset: 1 - x },
      ],
      fromMetric: (u: readonly number[]): number[] => u.slice(),
      toPhysicalCovector: (u: readonly number[]): number[] => u.slice(),
    }),
    retract: (x: number, u: readonly number[]): number => x + u[0]!,
    requestUntiltedEstimate: true,
    accepted: (
      ...args: [
        number,
        readonly number[],
        number,
        number,
        (IAutoMovieRecoveryUntiltedEstimate | null)?,
      ]
    ): void => {
      argumentsCount = args.length;
      notifications++;
      const current: IAutoMovieRecoveryUntiltedEstimate | null | undefined =
        args[4];
      estimateState = current === undefined ? 0 : current === null ? 1 : 2;
      estimateWidth = current?.width ?? 0;
      estimateRows = current?.rowCount ?? 0;
      selectedCount = current?.selected.length ?? 0;
      multiplierCount = current?.multipliers.length ?? 0;
    },
  };
  const direction: Parameters<typeof refineRecoveryFeasibleState>[3] = {
    maxIterations: 10000,
    maxEntries: 10000,
    maxWork: 10000000,
  };
  const auxiliary: NonNullable<
    Parameters<typeof refineRecoveryFeasibleState>[6]
  > = {
    maxEntries: 10000,
    maxResidentEntries: 100000,
    retainedEntries: 0,
    maxSweeps: 64,
    minimumSingularRatio: 1e-8,
    maxWork: 10000000,
  };
  const qualified: ReturnType<typeof refineRecoveryFeasibleState<number>> =
    refineRecoveryFeasibleState(
      { ...problem, constraintValues: (): number[] => [] },
      2,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  TestValidator.predicate(
    "selected tie keeps a qualified empty original estimate",
    qualified.acceptedSteps === 1 &&
      notifications === 1 &&
      argumentsCount === 5 &&
      estimateState === 2 &&
      estimateWidth === 1 &&
      estimateRows === 2 &&
      selectedCount === 0 &&
      multiplierCount === 0 &&
      nclose(qualified.state, 0.1, 1e-12),
  );
  notifications = 0;
  const mixNull: ReturnType<typeof refineRecoveryFeasibleState<number>> =
    refineRecoveryFeasibleState(
      {
        ...problem,
        evaluate: (x: number): number => (x - 2) ** 2 / 2,
        linearize: (x: number): IAutoMovieRecoveryFeasibleModel => ({
          width: 1,
          rows: [
            { indices: [0], values: [x - 2], offset: 0 },
            { indices: [0], values: [1], offset: 10 - x },
          ],
          physicalRows: [
            { indices: [0], values: [x - 2], offset: 0 },
            { indices: [0], values: [1], offset: 10 - x },
          ],
          fromMetric: (u: readonly number[]): number[] => u.slice(),
          toPhysicalCovector: (u: readonly number[]): number[] => u.slice(),
        }),
        constraintValues: (): number[] => [],
      },
      2,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  TestValidator.predicate(
    "complete affine estimate survives unavailable mixed direction",
    mixNull.acceptedSteps === 1 &&
      mixNull.trials.baseline === 1 &&
      mixNull.trials.nominal === 0 &&
      mixNull.lastSqp?.qualified === true &&
      notifications === 1 &&
      estimateState === 2 &&
      selectedCount === 0 &&
      multiplierCount === 0,
  );
  notifications = 0;
  const requested: ReturnType<typeof refineRecoveryFeasibleState<number>> =
    refineRecoveryFeasibleState(
      problem,
      1,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  TestValidator.predicate(
    "remaining-one estimate is unavailable rather than invented zero",
    requested.acceptedSteps === 1 &&
      notifications === 1 &&
      argumentsCount === 5 &&
      estimateState === 1,
  );
  const absent: ReturnType<typeof refineRecoveryFeasibleState<number>> =
    refineRecoveryFeasibleState(
      { ...problem, requestUntiltedEstimate: undefined },
      1,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  TestValidator.predicate(
    "absent request preserves four arguments and numerical work",
    argumentsCount === 4 &&
      estimateState === 0 &&
      nclose(requested.state, absent.state, 1e-15) &&
      requested.directionWork === absent.directionWork + 32 &&
      requested.trials.work === absent.trials.work,
  );
  notifications = 0;
  const initial: ReturnType<typeof refineRecoveryFeasibleState<number>> =
    refineRecoveryFeasibleState(
      { ...problem, initial: 0.1 },
      1,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  const refused: ReturnType<typeof refineRecoveryFeasibleState<number>> =
    refineRecoveryFeasibleState(
      {
        ...problem,
        evaluate: (x: number): number | null => (x === 0 ? 0.005 : null),
      },
      1,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  evaluations = 0;
  let missingOwner: boolean = false;
  try {
    refineRecoveryFeasibleState(
      { ...problem, accepted: undefined },
      1,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  } catch {
    missingOwner = true;
  }
  TestValidator.predicate(
    "no selection has no borrowed handoff",
    initial.converged &&
      initial.iterations === 0 &&
      refused.acceptedSteps === 0 &&
      notifications === 0 &&
      missingOwner &&
      evaluations === 0,
  );
  const marker: Error = new Error("estimate-precommit");
  let checkpointed: boolean = false,
    wrapperError: boolean = false,
    callbackError: boolean = false;
  try {
    refineRecoveryFeasibleState(
      problem,
      1,
      1e-8,
      direction,
      (): void => {
        checkpointed = true;
      },
      (work: number): void => {
        if (checkpointed && work === 32) throw marker;
      },
      auxiliary,
    );
  } catch (error: unknown) {
    wrapperError = error === marker;
  }
  try {
    refineRecoveryFeasibleState(
      {
        ...problem,
        accepted: (): void => {
          throw marker;
        },
      },
      1,
      1e-8,
      direction,
      (): void => {},
      (): void => {},
      auxiliary,
    );
  } catch (error: unknown) {
    callbackError = error === marker;
  }
  TestValidator.predicate(
    "precommit original errors are propagated",
    wrapperError && callbackError && notifications === 0,
  );
}
