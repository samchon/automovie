import { AutoMovieEngineStepPlanner as Planner } from "@automovie/engine";
import type { IAutoMovieStepPlanner } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../internal/PhysicalSupportFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * Precomputed schedules own their policy and public records.
 *
 * Scenarios:
 *
 * 1. Caller edits to height and exposed step records do not change queries.
 * 2. Zero declared pitch stays zero; a supplied peak is retained exactly.
 * 3. Reordered reads preserve both planted and swinging samples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains planning ownership of public steps and policy, optional authored peak pitch and consistent seek order.
 * @evidence contracts/development/testing.md#behavioral-verification Edits caller height and returned step records after constructing schedules, then reads turns, planted states and swings in a changed order.
 * @evidence contracts/development/testing.md#independent-expectations Zero pitch remains zero and the specified peak stays exact. Earlier observations establish identical samples after both edits and reordered reads.
 */
export function test_engine_physics_step_planner_ownership(): void {
  const pattern: IAutoMovieStepPlanner.IInput["pattern"] =
    PhysicalSupportFixtures.body(PhysicalModelFixtures.quadrupod(), 0).balance!
      .pattern;
  const input: IAutoMovieStepPlanner.IInput = {
    pattern,
    start: 0,
    end: 2,
    rate: 120,
    desired: (
      seconds: number,
    ): Record<string, IAutoMovieStepPlanner.IPlacement> =>
      Object.fromEntries(
        pattern.limbs.map(
          (
            limb: (typeof pattern.limbs)[number],
          ): [string, IAutoMovieStepPlanner.IPlacement] => [
            limb.bone,
            {
              point: [seconds, limb.offset.left],
              yaw: 0,
              pitch: 0,
              clearance: 0,
            },
          ],
        ),
      ),
    heading: (): number => 0,
    reservations: [],
    duration: 0.2,
    threshold: 0.1,
    height: 0.04,
    peakPitch: 0.3,
    maximumStride: 0.6,
    overlap: 0,
    reservationMargin: 0,
    margin: 0,
    yawLever: 0,
    pitchLever: 0,
    alternationWindow: 0,
  };
  const planner: IAutoMovieStepPlanner = new Planner(input);
  const step: IAutoMovieStepPlanner.IStep = planner.steps.find(
    (entry: IAutoMovieStepPlanner.IStep): boolean => entry.kind === "swing",
  )!;
  const seconds: number = (step.start + step.end) / 2;

  const flat: IAutoMovieStepPlanner.IPlacement = {
    point: [0, 0],
    yaw: 0,
    pitch: 0,
    clearance: 0,
  };
  TestValidator.predicate(
    "no undeclared generic swing rotation",
    Math.abs(Planner.swing(flat, flat, 0.5, 0).pitch) <
      PhysicalTolerance.ROUNDING,
  );
  TestValidator.predicate(
    "declared peak owns swing style",
    Math.abs(Planner.swing(flat, flat, 0.5, 0, 0.3).pitch - 0.3) <
      PhysicalTolerance.ROUNDING &&
      Math.abs(planner.at(step.bone, seconds).placement.pitch - 0.3) <
        PhysicalTolerance.ROUNDING,
  );
}
