import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { fitRecoveryResectionConsensus } from "../../../../packages/recovery/src/internal/fitRecoveryResectionConsensus";
import { fitRecoveryResectionDesign } from "../../../../packages/recovery/src/internal/fitRecoveryResectionDesign";
import { sampleRecoveryCameraIndices } from "../../../../packages/recovery/src/internal/sampleRecoveryCameraIndices";
import type { IAutoMovieRecoveryResectionDesignTrace } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryResectionDesignTrace";
import type { IAutoMovieRecoveryResectionTrace } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryResectionTrace";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Optional resection evidence preserves the actual estimator and refusal path.
 *
 * Scenarios:
 * 1. Disabled and enabled tracing recover identical coefficients, support, proposal stream, counters and final-refinement report on independent skewed pinhole data with separated outliers, even if the observer mutates its event snapshot.
 * 2. Each real proposal and final refit has exactly one event; accepted projective coefficients reproduce the prescribed pixel chart and stable final membership agrees with the result.
 * 3. Insufficient pairs, coincident points, planar span and a deliberately nonrigid projective camera retain the first failing stage without qualifying diagnostic coefficients as a pose.
 * 4. A numerical-looking observer error propagates rather than becoming a counted proposal refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained initializer and robust estimator with and without the optional observer, comparing all result fields and event counts, raw projection, refusal stages and thrown observer identity.
 * @evidence contracts/testing.md#independent-expectations Prescribed three-dimensional coordinates and scalar pinhole projections define the camera; an anisotropic 3-by-3 projective block is intentionally nonrigid. An observer must preserve the unobserved result exactly, which is a side-effect invariant rather than a photographic accuracy oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers no observer, enabled observation, initialization refusal before and after projective estimation, failed rigid projection, real final membership and an error with the same prefix as numerical refusals. Existing map tests own derivative, gauge and optimizer accuracy.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_recovery_camera_resection_trace entry owns resident finite arrays and synchronous callbacks only; no file, process, installation, foreign replacement, viewer or native artifact is created.
 */
export function test_recovery_camera_resection_trace(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const chart: ReturnType<typeof createRecoveryCameraChart> =
    createRecoveryCameraChart(fixture.input.views[2]!);
  const pixels: [number, number][] = fixture.pixels[2]!.map(
    (pixel: [number, number], at: number): [number, number] =>
      at % 5 === 0 ? [pixel[0] + 100, pixel[1] - 70] : [...pixel],
  );
  const events: IAutoMovieRecoveryResectionTrace[] = [];
  let proposals: number = 0;
  const ordinary: ReturnType<typeof fitRecoveryResectionConsensus> =
    fitRecoveryResectionConsensus(
      fixture.points,
      pixels,
      chart.matrix,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  const observed: ReturnType<typeof fitRecoveryResectionConsensus> =
    fitRecoveryResectionConsensus(
      fixture.points,
      pixels,
      chart.matrix,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
      (): void => {
        proposals++;
      },
      (event: IAutoMovieRecoveryResectionTrace): void => {
        events.push(structuredClone(event));
        if (event.before) event.before.indices.length = 0;
        if (event.after) event.after.indices.push(-1);
        if (event.beforePose) event.beforePose.translation[0] = 1e10;
        if (event.afterPose) event.afterPose.rotation[0] = 1e10;
        if (event.refinement) event.refinement.pose.translation[0] = -1e10;
      },
    );
  TestValidator.equals(
    "diagnostic support and reasons unchanged",
    {
      indices: observed.indices,
      reasons: observed.refusalReasons,
    },
    { indices: ordinary.indices, reasons: ordinary.refusalReasons },
  );
  TestValidator.predicate(
    "all fit decisions and coefficients unchanged",
    ordinary.pose !== null &&
      observed.pose !== null &&
      observed.pose.rotation.every((value: number, at: number): boolean =>
        nclose(value, ordinary.pose!.rotation[at]!, 0),
      ) &&
      observed.pose.translation.every((value: number, at: number): boolean =>
        nclose(value, ordinary.pose!.translation[at]!, 0),
      ) &&
      observed.trials === ordinary.trials &&
      observed.trials === proposals &&
      observed.requiredTrials === ordinary.requiredTrials &&
      observed.localRefinements === ordinary.localRefinements &&
      observed.numericalRefusals === ordinary.numericalRefusals &&
      observed.finalRefits === ordinary.finalRefits &&
      observed.stable === ordinary.stable &&
      observed.refinement!.converged === ordinary.refinement!.converged &&
      observed.refinement!.iterations === ordinary.refinement!.iterations &&
      observed.refinement!.acceptedSteps ===
        ordinary.refinement!.acceptedSteps &&
      observed.refinement!.termination === ordinary.refinement!.termination &&
      nclose(
        observed.refinement!.initialCost,
        ordinary.refinement!.initialCost,
        0,
      ) &&
      nclose(
        observed.refinement!.finalCost,
        ordinary.refinement!.finalCost,
        0,
      ) &&
      nclose(
        observed.refinement!.minimumDesignRatio,
        ordinary.refinement!.minimumDesignRatio,
        0,
      ),
  );
  const draws: IAutoMovieRecoveryResectionTrace[] = events.filter(
    (event: IAutoMovieRecoveryResectionTrace): boolean =>
      event.phase === "proposal",
  );
  const refits: IAutoMovieRecoveryResectionTrace[] = events.filter(
    (event: IAutoMovieRecoveryResectionTrace): boolean =>
      event.phase === "final-refit",
  );
  TestValidator.predicate(
    "one event per actual draw and final fit",
    draws.length === ordinary.trials &&
      refits.length === ordinary.finalRefits &&
      draws.every(
        (event: IAutoMovieRecoveryResectionTrace, at: number): boolean =>
          event.index === at &&
          event.sample.length === 6 &&
          new Set(event.sample).size === 6 &&
          event.sample.every(
            (i: number): boolean =>
              Number.isInteger(i) && i >= 0 && i < fixture.points.length,
          ),
      ) &&
      draws.filter(
        (event: IAutoMovieRecoveryResectionTrace): boolean =>
          event.refinementAttempted,
      ).length === ordinary.localRefinements &&
      refits.at(-1)!.stable === true,
  );
  TestValidator.equals(
    "last refit support equals the qualified result",
    refits.at(-1)!.after!.indices,
    ordinary.indices,
  );
  TestValidator.equals(
    "the declared deterministic sample stream is unchanged",
    draws.map(
      (event: IAutoMovieRecoveryResectionTrace): readonly number[] =>
        event.sample,
    ),
    draws.map((_: unknown, at: number): number[] =>
      sampleRecoveryCameraIndices(
        fixture.points.length,
        6,
        fixture.input.policy.samplingSeed,
        0x504e5052,
        at,
      ),
    ),
  );
  const trace: IAutoMovieRecoveryResectionDesignTrace = { stage: "admission" };
  fitRecoveryResectionDesign(
    fixture.points,
    fixture.pixels[2]!,
    chart.inverse,
    fixture.input.policy,
    fixture.input.budget,
    trace,
  );
  TestValidator.predicate(
    "raw projective chart agrees with independent pixels",
    trace.stage === "complete" &&
      trace.projective!.length === 12 &&
      fixture.points.every(
        (point: [number, number, number], at: number): boolean => {
          const q: number[] = [0, 1, 2].map(
            (row: number): number =>
              trace.projective![4 * row + 3]! +
              point.reduce(
                (sum: number, value: number, col: number): number =>
                  sum + value * trace.projective![4 * row + col]!,
                0,
              ),
          );
          return (
            nclose(
              (chart.matrix[0]! * q[0]! + chart.matrix[1]! * q[1]!) / q[2]! +
                chart.matrix[2]!,
              fixture.pixels[2]![at]![0],
              1e-7,
            ) &&
            nclose(
              (chart.matrix[4]! * q[1]!) / q[2]! + chart.matrix[5]!,
              fixture.pixels[2]![at]![1],
              1e-7,
            )
          );
        },
      ),
  );
  for (const shape of ["short", "coincident", "planar", "nonrigid"] as const) {
    const diagnostic: IAutoMovieRecoveryResectionDesignTrace = {
      stage: "admission",
    };
    const points: [number, number, number][] =
      shape === "short"
        ? fixture.points.slice(0, 5)
        : shape === "coincident"
          ? fixture.points.map((): [number, number, number] => [0, 0, 0])
          : shape === "planar"
            ? fixture.points.map(
                (point: [number, number, number]): [number, number, number] => [
                  point[0],
                  point[1],
                  8,
                ],
              )
            : fixture.points;
    const measured: [number, number][] =
      shape === "nonrigid"
        ? fixture.points.map(
            (point: [number, number, number]): [number, number] => [
              (3 * chart.matrix[0]! * point[0] + chart.matrix[1]! * point[1]) /
                point[2] +
                chart.matrix[2]!,
              (chart.matrix[4]! * point[1]) / point[2] + chart.matrix[5]!,
            ],
          )
        : fixture.pixels[2]!.slice(0, points.length);
    let refused: boolean = false;
    try {
      fitRecoveryResectionDesign(
        points,
        measured,
        chart.inverse,
        fixture.input.policy,
        fixture.input.budget,
        diagnostic,
      );
    } catch {
      refused = true;
    }
    const expected: IAutoMovieRecoveryResectionDesignTrace["stage"] =
      shape === "short"
        ? "admission"
        : shape === "coincident"
          ? "normalization"
          : shape === "planar"
            ? "span"
            : "projection";
    TestValidator.predicate(
      `first failing stage ${shape}`,
      refused &&
        diagnostic.stage === expected &&
        (shape === "nonrigid"
          ? diagnostic.projective!.length === 12 &&
            diagnostic.projectedPose !== undefined &&
            diagnostic.projectionError! >
              fixture.input.policy.maximumRotationProjectionError
          : diagnostic.projective === undefined),
    );
  }
  const sentinel: Error = new Error("camera-resection: observer sentinel");
  let propagated: unknown = null;
  try {
    fitRecoveryResectionConsensus(
      fixture.points,
      pixels,
      chart.matrix,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
      (): void => {},
      (): never => {
        throw sentinel;
      },
    );
  } catch (error: unknown) {
    propagated = error;
  }
  TestValidator.predicate(
    "observer failure is not a numerical refusal",
    propagated === sentinel,
  );
}
