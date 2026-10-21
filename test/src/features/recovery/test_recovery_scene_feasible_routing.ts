import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { createRecoveryCameraScene } from "../../../../packages/recovery/src/internal/createRecoveryCameraScene";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Explicit internal routing preserves complete scene checkpoints and defaults.
 *
 * Scenarios:
 * 1. Original five-view visibility data routes the method and coherent normal/QP reports through seed and candidate fits under its unchanged250000 resident ceiling; a larger valid population refuses without discarding the accepted component.
 * 2. A90000 fit cap admits the prescribed seed but refuses the next complete candidate; all proposed geometry rolls back while the consumed ledger survives.
 * 3. Callback mutation of caller options and scene budget cannot change the owned requested method or reported original ceiling.
 * 4. Seed capacity refusal has no accepted geometry, aggregate exhaustion remains budget-exhausted, and numerical-looking callback errors escape with original identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes actual coordinator, seed, resection, checkpoint and feasible fit owners. Observes method reports, complete rollback, ordered attempts, work and borrowed input preservation.
 * @evidence contracts/testing.md#independent-expectations Prescribed poses/points and feature identities define geometry. Seed C5/L24/E48 base43344 with adaptive agreement fits90000; candidate C11/L48/E120 base131776 does not. Original full five-view adaptive base330528 exceeds250000, so the explicit route must not bypass the original ceiling. Omitted ordinary all-five behavior is owned by the unchanged pipeline test.
 * @evidence contracts/testing.md#distinguishing-cases Covers seed/candidate request propagation, bounded partial coverage, initial normal reports, mutating callbacks, tiny fit capacity, aggregate work exhaustion and callback error identity. No initial-KKT report proves actual curvature use; fixed photo evidence and independent local-factor tests remain separate.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_scene_feasible_routing entry uses analytic resident arrays; no photograph, host, process, filesystem, compiler, installation, browser or GPU starts.
 */
export function test_recovery_scene_feasible_routing(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraScene> =
    admitRecoveryCameraScene(fixture.input);
  const request: () => IAutoMovieRecoveryFeasibleJointOptions =
    (): IAutoMovieRecoveryFeasibleJointOptions => ({
      directionBudget: {
        maxIterations: 10000,
        maxEntries: 25000,
        maxWork: 10000000000,
      },
      maxResidentLinearEntries: 250000,
      sqpAcceleration: true,
      adaptiveRegularization: true,
      laggedLagrangianMetric: true,
    });
  const before: string = JSON.stringify({
    features: fixture.features,
    pairs: fixture.pairs,
    poses: fixture.poses,
  });
  const routed: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      fixture.input,
      fixture.features,
      charts,
      fixture.pairs,
      fixture.comparisons,
      (): void => {},
      request(),
    );
  TestValidator.predicate(
    "explicit method uses both checkpoints without bypassing the original ceiling",
    routed.status === "accepted-sparse-component" &&
      routed.stopReason === "no-qualified-growth" &&
      routed.registeredViews.join(",") === "0,1,2" &&
      routed.landmarks.length === 48 &&
      routed.joint?.converged === true &&
      routed.joint.curvature !== undefined &&
      routed.joint.regularization !== undefined &&
      routed.joint.feasible?.normalKktQualified === true &&
      routed.joint.feasible.lastDirection?.certified === true &&
      routed.attempts[0]!.outcome === "accepted" &&
      routed.attempts[0]!.joint?.curvature !== undefined &&
      routed.attempts[0]!.joint?.feasible?.normalKktQualified === true &&
      routed.attempts.some(
        (attempt: (typeof routed.attempts)[number]): boolean =>
          attempt.outcome === "joint-refused" &&
          attempt.reasons.includes("camera-feasible-capacity: resident"),
      ) &&
      routed.budget.maxResidentLinearEntries === 250000,
  );
  const boundedOptions: IAutoMovieRecoveryFeasibleJointOptions = {
    ...request(),
    maxResidentLinearEntries: 90000,
  };
  const boundedInput: typeof fixture.input = {
    ...fixture.input,
    budget: { ...fixture.input.budget },
  };
  let mutated: boolean = false;
  const bounded: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      boundedInput,
      fixture.features,
      charts,
      fixture.pairs,
      fixture.comparisons,
      (): void => {
        if (!mutated) {
          mutated = true;
          boundedOptions.directionBudget.maxEntries = 1;
          boundedOptions.maxResidentLinearEntries = 1;
          boundedOptions.laggedLagrangianMetric = false;
          boundedInput.budget.maxJointFits = 1;
          boundedInput.budget.maxResidentLinearEntries = 1;
          boundedInput.budget.maxLinearWork = 1;
        }
      },
      boundedOptions,
    );
  TestValidator.predicate(
    "candidate capacity refuses the entire proposal and keeps the owned method",
    bounded.status === "seed-only" &&
      bounded.registeredViews.join(",") === "0,1" &&
      bounded.landmarks.length === 24 &&
      bounded.poses
        .slice(2)
        .every(
          (pose: (typeof bounded.poses)[number]): boolean => pose === null,
        ) &&
      bounded.joint?.converged === true &&
      bounded.joint.curvature !== undefined &&
      bounded.joint.regularization !== undefined &&
      bounded.joint.feasible?.normalKktQualified === true &&
      bounded.joint.feasible.lastDirection?.certified === true &&
      bounded.attempts.length === 1 &&
      bounded.attempts[0]!.outcome === "joint-refused" &&
      bounded.attempts[0]!.reasons.includes(
        "camera-feasible-capacity: resident",
      ) &&
      bounded.budget.maxJointFits === 32 &&
      bounded.budget.maxResidentLinearEntries === 250000 &&
      bounded.budget.maxLinearWork === 10000000000 &&
      bounded.work.jointFits === 2 &&
      bounded.work.triangulations >= 48 &&
      bounded.work.linearWork > 256,
  );
  TestValidator.predicate(
    "every accepted point retains prescribed identity and geometry after rollback",
    bounded.landmarks.every(
      (landmark: (typeof bounded.landmarks)[number]): boolean => {
        const observation: (typeof landmark.observations)[number] =
          landmark.observations[0]!;
        const id: number =
          fixture.identities[observation.viewIndex]![observation.featureIndex]!;
        return (
          landmark.observations.length === 2 &&
          landmark.point.every((value: number, axis: number): boolean =>
            nclose(value, fixture.points[id]![axis]!, 1e-4),
          )
        );
      },
    ) &&
      before ===
        JSON.stringify({
          features: fixture.features,
          pairs: fixture.pairs,
          poses: fixture.poses,
        }),
  );
  const tiny: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      fixture.input,
      fixture.features,
      charts,
      fixture.pairs,
      fixture.comparisons,
      (): void => {},
      { ...request(), maxResidentLinearEntries: 1 },
    );
  TestValidator.predicate(
    "seed capacity returns no unqualified checkpoint and preserves consumed work",
    tiny.stopReason === "seed-refused" &&
      tiny.registeredViews.length === 0 &&
      tiny.landmarks.length === 0 &&
      tiny.refusalReasons.includes("camera-feasible-capacity: resident") &&
      tiny.work.jointFits === 1 &&
      tiny.work.triangulations === 24 &&
      tiny.work.linearWork > 256,
  );
  const exhausted: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      {
        ...fixture.input,
        budget: { ...fixture.input.budget, maxLinearWork: 256 },
      },
      fixture.features,
      charts,
      fixture.pairs,
      fixture.comparisons,
      (): void => {},
      {
        ...request(),
        directionBudget: {
          maxIterations: 10000,
          maxEntries: 25000,
          maxWork: 256,
        },
      },
    );
  TestValidator.predicate(
    "aggregate exhaustion remains distinct from fit capacity",
    exhausted.stopReason === "budget-exhausted" &&
      exhausted.work.linearWork === 256 &&
      exhausted.landmarks.length === 0,
  );
  const marker: Error = new Error(
    "camera-map: callback is not a geometric refusal",
  );
  let caught: unknown = null;
  try {
    createRecoveryCameraScene(
      fixture.input,
      fixture.features,
      charts,
      fixture.pairs,
      fixture.comparisons,
      (phase: string): void => {
        if (phase === "scene-seed-component") throw marker;
      },
      request(),
    );
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "callback identity propagates before transaction classification",
    caught === marker,
  );
}
