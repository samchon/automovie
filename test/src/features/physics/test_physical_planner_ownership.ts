import { TestValidator } from "@nestia/e2e";

import { AutoMovieStepPlanner as Planner } from "../../../../packages/engine/src/physics/AutoMovieStepPlanner";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Precomputed schedules own their policy and public records.
 *
 * Scenarios:
 * 1. Caller edits to height and exposed step records do not change queries.
 * 2. Zero declared pitch stays zero; a supplied peak is retained exactly.
 * 3. Reordered reads preserve both planted and swinging samples.
 */
export function test_physical_planner_ownership(): void {
  const pattern: Planner.IInput["pattern"] = PhysicalSupportFixtures.body(
    PhysicalModelFixtures.quadrupod(),
    0,
  ).balance!.pattern;
  const input: Planner.IInput = {
    pattern,
    start: 0,
    end: 2,
    rate: 120,
    desired: (seconds: number): Record<string, Planner.IPlacement> =>
      Object.fromEntries(
        pattern.limbs.map(
          (
            limb: (typeof pattern.limbs)[number],
          ): [string, Planner.IPlacement] => [
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
  const planner: Planner = new Planner(input);
  const step: Planner.IStep = planner.steps.find(
    (entry: Planner.IStep): boolean => entry.kind === "swing",
  )!;
  const seconds: number = (step.start + step.end) / 2;
  const before: string = JSON.stringify(planner.at(step.bone, seconds));
  input.height = 3;
  input.peakPitch = -2;
  Reflect.set(step.to.point, "0", 100);
  Reflect.set(planner.steps, planner.steps.length, { ...step, end: 100 });
  planner.at(step.bone, 2);
  planner.at(step.bone, 0);
  TestValidator.equals(
    "owned precomputed query survives external mutations and seeks",
    JSON.stringify(planner.at(step.bone, seconds)),
    before,
  );
  const flat: Planner.IPlacement = {
    point: [0, 0],
    yaw: 0,
    pitch: 0,
    clearance: 0,
  };
  TestValidator.predicate(
    "no undeclared generic swing rotation",
    Math.abs(Planner.swing(flat, flat, 0.5, 0).pitch) < 1e-12,
  );
  TestValidator.predicate(
    "declared peak owns swing style",
    Math.abs(Planner.swing(flat, flat, 0.5, 0, 0.3).pitch - 0.3) < 1e-12 &&
      Math.abs(planner.at(step.bone, seconds).placement.pitch - 0.3) < 1e-12,
  );
}
