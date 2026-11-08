import { IAutoMovieImpactBody, resolveImpact } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

const BODY: IAutoMovieImpactBody = {
  mass: 1,
  velocity: v(0, 0, 0),
  restitution: 0.2,
  hardness: 0.5,
  penetrability: 0.1,
};

const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

/**
 * `resolveImpact` computes impulse with reciprocal body masses. Invalid masses
 * must fail before `1 / mass` can produce `Infinity`, `NaN`, or impossible
 * momentum transfer.
 *
 * Scenarios:
 *
 * 1. Body `a` rejects zero, negative, and non-finite masses before impulse math.
 * 2. Body `b` rejects the same invalid masses before impulse math.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves impacts with invalid mass on either body and requires throws, catching reciprocal-mass math admitted for zero, negative or non-finite mass.
 * @evidence contracts/development/testing.md#independent-expectations Positive finite kilogram mass is the input contract and supplies refusal independently of impulse output; exception type and internal evaluation order are not asserted.
 * @evidence contracts/development/testing.md#distinguishing-cases Crosses zero, negative, NaN and infinity with body a and body b; valid impulse response and other invalid fields belong to neighboring impact units.
 * @evidence contracts/development/testing.md#execution-ownership The named exported portable unit owns all local cases and calls resolveImpact directly without a host or dynamic registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Body `a` rejects zero, negative, and non-finite masses before impulse math.).
 */
export function test_physics_impact_body_mass(): void {
  const moving: IAutoMovieImpactBody = { ...BODY, velocity: v(0, 0, 10) };
  const normal: IAutoMovieVector3 = v(0, 0, 1);

  for (const mass of [0, -1, Number.NaN, Infinity]) {
    TestValidator.predicate(
      `body a mass ${mass} throws`,
      throws(
        (): ReturnType<typeof resolveImpact> =>
          resolveImpact({ ...moving, mass }, BODY, normal),
      ),
    );
    TestValidator.predicate(
      `body b mass ${mass} throws`,
      throws(
        (): ReturnType<typeof resolveImpact> =>
          resolveImpact(moving, { ...BODY, mass }, normal),
      ),
    );
  }
}
