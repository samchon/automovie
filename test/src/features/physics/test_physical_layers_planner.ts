import { AutoMovieStepPlanner as Planner } from "@automovie/engine";
import type { IAutoMovieFootfallPattern } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Physical planner behavior.
 *
 * Scenarios:
 * 1. Exercise actual public inputs and compare physical quantities.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMovieStepPlanner` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate; 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_layers_planner`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: Exercise actual public inputs and compare physical quantities.).
 */
export function test_physical_layers_planner(): void {
  for (const count of [2, 4]) {
    const pattern: IAutoMovieFootfallPattern = supports(count);
    const desired: (seconds: number) => Record<string, Planner.IPlacement> = (
      seconds: number,
    ): Record<string, Planner.IPlacement> =>
      Object.fromEntries(
        pattern.limbs.map(
          (
            limb: (typeof pattern.limbs)[number],
          ): [string, Planner.IPlacement] => [
            limb.bone,
            {
              point: [
                Math.max(0, Math.min(2, seconds - 1)) + limb.offset.forward,
                limb.offset.left,
              ],
              yaw: 0,
              pitch: 0,
              clearance: 0,
            },
          ],
        ),
      );
    const planner: Planner = new Planner({
      pattern,
      start: 0,
      end: 5,
      rate: 120,
      desired,
      heading: (): number => 0,
      reservations: [{ bone: "support-0", start: 2, end: 2.4 }],
      duration: 0.2,
      threshold: 0.05,
      height: 0.06,
      maximumStride: 0.6,
      overlap: -0.03,
      reservationMargin: 0.04,
      margin: 0.03,
      yawLever: 0.12,
      pitchLever: 0.05,
      alternationWindow: 0.35,
    });
    TestValidator.predicate(`${count} supports all step`, (): boolean =>
      pattern.limbs.every((limb: (typeof pattern.limbs)[number]): boolean =>
        planner.steps.some(
          (step: (typeof planner.steps)[number]): boolean =>
            step.bone === limb.bone && step.kind === "swing",
        ),
      ),
    );
    TestValidator.predicate(
      `${count} supports honor the reservation`,
      (): boolean =>
        planner.at("support-0", 2.2).phase === "reserved" &&
        planner.steps
          .filter(
            (step: (typeof planner.steps)[number]): boolean =>
              step.kind === "swing",
          )
          .every(
            (step: Planner.IStep): boolean =>
              step.end <= 2 || step.start >= 2.4,
          ),
    );
    for (const limb of pattern.limbs) {
      const steps: Planner.IStep[] = planner.steps.filter(
        (step: (typeof planner.steps)[number]): boolean =>
          step.bone === limb.bone,
      );
      for (const [index, step] of steps.entries()) {
        const end: number = steps[index + 1]?.start ?? 5;
        if (end <= step.end) continue;
        const planted: Planner.IState = planner.at(
          limb.bone,
          step.end + (end - step.end) / 3,
        );
        const again: Planner.IState = planner.at(
          limb.bone,
          step.end + ((end - step.end) * 2) / 3,
        );
        TestValidator.predicate(
          `${limb.bone} planted coordinates do not drift`,
          (): boolean =>
            planted.phase === "planted" &&
            again.phase === "planted" &&
            Math.hypot(
              planted.placement.point[0] - again.placement.point[0],
              planted.placement.point[1] - again.placement.point[1],
            ) < 1e-12,
        );
        const next: Planner.IStep | undefined = steps[index + 1];
        if (next)
          TestValidator.predicate(
            `${limb.bone} next departure retains the last landing`,
            (): boolean =>
              Math.hypot(
                next.from.point[0] - step.to.point[0],
                next.from.point[1] - step.to.point[1],
              ) < 1e-12,
          );
      }
    }
  }
}

/** Rectangular support geometry and declared timing, without a species name. */
function supports(count: number): IAutoMovieFootfallPattern {
  return {
    id: `supports-${count}`,
    minimumSupports: 1,
    limbs: Array.from(
      { length: count },
      (
        _: unknown,
        index: number,
      ): {
        bone: string;
        chain: string[];
        phase: number;
        duty: number;
        offset: { forward: number; left: number };
        stride: { speed: number; length: number }[];
      } => ({
        bone: `support-${index}`,
        chain: ["root", `support-${index}`],
        phase: index / count,
        duty: 0.6,
        offset: {
          forward: count === 4 ? (index < 2 ? 0.3 : -0.3) : 0,
          left: index % 2 === 0 ? 0.2 : -0.2,
        },
        stride: [
          { speed: 0, length: 0.6 },
          { speed: 2, length: 0.6 },
        ],
      }),
    ),
  };
}
