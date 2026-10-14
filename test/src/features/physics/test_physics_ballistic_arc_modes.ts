import { solveBallisticLaunch, solveMovingLaunch } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const target: IAutoMovieVector3 = { x: 8, y: 1, z: 0 };
const invalidArc: Parameters<typeof solveBallisticLaunch>[4] = "flat" as Parameters<typeof solveBallisticLaunch>[4];

/**
 * Observe rejection of an unknown runtime ballistic arc mode by both static and moving launch solvers. The explicit type assertion injects the same invalid JavaScript value while keeping the public TypeScript signature intact.
 *
 * Scenarios:
 *
 * 1. Static launch returns `null` for an unknown arc mode.
 * 2. Moving launch returns null for the same bad mode without sampling its supplied target callback.
 * 3. Valid `direct` and `high` modes still solve.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls both actual solvers with flat, requires null and observes a callback side-effect flag remaining false for moving launch. Static direct/high calls must remain non-null, separating invalid admission from unconditional refusal.
 * @evidence contracts/testing.md#independent-expectations The supported direct/high union defines the categorical expectation, and the literal flat input is outside it. The callback flag independently exposes whether invalid admission reached target sampling; no floating-point result is compared or synthesized into an expected answer.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the invalid static/moving twins, skipped callback observation and valid static direct/high controls with original positions and speed 14. Other invalid inputs, valid moving convergence, flight ordering and landing accuracy belong to other units.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns both solver calls and the local callback flag. Its supplied target callback is not a separately registered test, and no native artifact, process or viewer is required.
 */
export function test_physics_ballistic_arc_modes(): void {
  TestValidator.predicate(
    "invalid static arc is null",
    solveBallisticLaunch(origin, target, 14, undefined, invalidArc) === null,
  );

  let sampled: boolean = false;
  TestValidator.predicate(
    "invalid moving arc is null",
    solveMovingLaunch(
      origin,
      (): IAutoMovieVector3 => {
        sampled = true;
        return target;
      },
      14,
      undefined,
      invalidArc,
    ) === null,
  );
  TestValidator.equals(
    "invalid moving arc skips target sampling",
    sampled,
    false,
  );

  TestValidator.equals(
    "direct and high remain valid",
    namedFacts([
      [
        "solveBallisticLaunchOriginTarget",
        (): boolean =>
          solveBallisticLaunch(origin, target, 14, undefined, "direct") !==
          null,
      ],
      [
        "solveBallisticLaunchOriginTarget2",
        (): boolean =>
          solveBallisticLaunch(origin, target, 14, undefined, "high") !== null,
      ],
    ]),
    {
      solveBallisticLaunchOriginTarget: true,
      solveBallisticLaunchOriginTarget2: true,
    },
  );
}
