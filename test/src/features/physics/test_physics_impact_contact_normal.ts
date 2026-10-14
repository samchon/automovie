import { IAutoMovieImpactBody, resolveImpact } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

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
 * `resolveImpact` normalizes the contact normal and returns it as a unit vector
 * in the impact result. Invalid contact normals must fail before normalization
 * can erase a collision direction or propagate non-finite impact data.
 *
 * Scenarios:
 *
 * 1. A zero contact normal throws before it can become a silent deflect.
 * 2. Non-finite contact normals throw before they can produce NaN impact fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls impact resolution with zero, NaN and infinite contact normals and requires throws, catching directionless or invalid contact admitted as a response.
 * @evidence contracts/testing.md#independent-expectations A normal must define a finite nonzero direction; authored invalid vectors establish refusal without using product response as an oracle. Exception presence does not prove evaluation order or normal normalization accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Separates zero magnitude from NaN and infinity components; valid normals and quantitative response belong to the impact unit, while other input guards have their own units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit supplies local impact records and owns every assertion without a real host or dynamic cases.
 */
export function test_physics_impact_contact_normal(): void {
  const moving: IAutoMovieImpactBody = { ...BODY, velocity: v(0, 0, 10) };

  TestValidator.predicate(
    "zero normal throws",
    throws((): ReturnType<typeof resolveImpact> => resolveImpact(moving, BODY, v(0, 0, 0))),
  );
  TestValidator.predicate(
    "nan normal throws",
    throws((): ReturnType<typeof resolveImpact> => resolveImpact(moving, BODY, v(Number.NaN, 0, 1))),
  );
  TestValidator.predicate(
    "infinite normal throws",
    throws((): ReturnType<typeof resolveImpact> => resolveImpact(moving, BODY, v(Infinity, 0, 1))),
  );
}
