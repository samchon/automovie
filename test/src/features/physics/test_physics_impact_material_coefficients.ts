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
 * `resolveImpact` material heuristics interpret restitution, hardness, and
 * penetrability as `[0,1]` coefficients. Invalid coefficients must fail before
 * comparisons can silently steer an impact into the wrong qualitative kind.
 *
 * Scenarios:
 *
 * 1. Body `a` rejects invalid material coefficients.
 * 2. Body `b` rejects invalid material coefficients.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves impacts with invalid restitution, hardness and penetrability on each body and requires throws, catching out-of-range or non-finite coefficients silently steering a response kind.
 * @evidence contracts/testing.md#independent-expectations The finite closed interval [0,1] is the coefficient contract; authored adjacent out-of-range and non-finite values determine refusal independently of the heuristic. Only exception presence is asserted.
 * @evidence contracts/testing.md#distinguishing-cases Crosses all three fields and both bodies with -0.1, 1.1, NaN and infinity; valid interior coefficients and response families belong to the impact unit. Exact valid coefficient endpoints are not established by these cases.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns every loop-generated assertion directly and invokes resolveImpact with local records; no dynamic test registration or host is used.
 */
export function test_physics_impact_material_coefficients(): void {
  const moving: IAutoMovieImpactBody = { ...BODY, velocity: v(0, 0, 10) };
  const normal: IAutoMovieVector3 = v(0, 0, 1);
  const fields: readonly ["restitution", "hardness", "penetrability"] = [
    "restitution",
    "hardness",
    "penetrability",
  ];

  for (const field of fields)
    for (const value of [-0.1, 1.1, Number.NaN, Infinity]) {
      TestValidator.predicate(
        `body a ${field} ${value} throws`,
        throws(
          (): ReturnType<typeof resolveImpact> =>
            resolveImpact({ ...moving, [field]: value }, BODY, normal),
        ),
      );
      TestValidator.predicate(
        `body b ${field} ${value} throws`,
        throws(
          (): ReturnType<typeof resolveImpact> =>
            resolveImpact(moving, { ...BODY, [field]: value }, normal),
        ),
      );
    }
}
