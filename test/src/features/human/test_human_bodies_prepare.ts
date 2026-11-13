import {
  AutoMovieHumanBodies,
  type AutoMovieHumanCanonicalBody,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import PEOPLE from "../internal/MOTION_HUMAN_PEOPLE.json";

/**
 * A prepared body is made once per parameter set and process, and a
 * different parameter set makes a different body.
 *
 * The parameter set is the small woman of the motion tests' boundary people.
 *
 * Scenarios:
 * 1. Asking twice with the same parameters, mass and id returns the same
 *    body, prepared once (the table grows by one).
 * 2. The same parameters under another id, or with another mass, make
 *    another body.
 * 3. The body carries the id as its skeleton's id.
 * 4. After `forget` the table is empty and the next ask prepares again: a
 *    new body object, equal in its skeleton's bone count.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Asks the public producer and compares the objects it returns and the table's size; a producer that prepares every time, or shares a body across ids or masses, fails.
 * @evidence contracts/development/testing.md#independent-expectations Sameness is object identity, difference is a new object; nothing is read from the producer's key.
 * @evidence contracts/development/testing.md#distinguishing-cases The same three, another id, another mass, and a release.
 * @evidence contracts/development/testing.md#execution-ownership Four preparations of one canonical body, 22 seconds in all, in memory with no process, browser or render; the test program discovers every `test_` function under `features`, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the parameter set and the 4 scenarios.
 */
export function test_human_bodies_prepare(): void {
  const params: IAutoMovieHumanParameters = PEOPLE["f-small"]
    .params as unknown as IAutoMovieHumanParameters;
  const mass: number = PEOPLE["f-small"].mass;
  AutoMovieHumanBodies.forget();
  const first: AutoMovieHumanCanonicalBody.IBody = AutoMovieHumanBodies.prepare(
    params,
    { mass, id: "a" },
  );
  const again: AutoMovieHumanCanonicalBody.IBody = AutoMovieHumanBodies.prepare(
    params,
    { mass, id: "a" },
  );
  TestValidator.equals(
    "the same three give the same body, prepared once",
    [first === again, AutoMovieHumanBodies.size()],
    [true, 1],
  );
  const named: AutoMovieHumanCanonicalBody.IBody = AutoMovieHumanBodies.prepare(
    params,
    { mass, id: "b" },
  );
  const heavier: AutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanBodies.prepare(params, { mass: mass + 1, id: "a" });
  TestValidator.equals(
    "another id or mass makes another body",
    [named === first, heavier === first, AutoMovieHumanBodies.size()],
    [false, false, 3],
  );
  TestValidator.equals(
    "the body carries its id",
    [first.skeleton.id, named.skeleton.id],
    ["a", "b"],
  );
  AutoMovieHumanBodies.forget();
  const fresh: AutoMovieHumanCanonicalBody.IBody = AutoMovieHumanBodies.prepare(
    params,
    { mass, id: "a" },
  );
  TestValidator.equals(
    "after a release the next ask prepares again",
    [
      AutoMovieHumanBodies.size(),
      fresh === first,
      fresh.skeleton.bones.length === first.skeleton.bones.length,
    ],
    [1, false, true],
  );
  AutoMovieHumanBodies.forget();
}
