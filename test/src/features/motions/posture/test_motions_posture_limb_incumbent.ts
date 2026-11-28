import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";
import {
  HumanLimbIncumbent
} from "../../../../../packages/motions/src/posture/internal/HumanLimbIncumbent";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../internal/throwsError";

/**
 * `HumanLimbIncumbent` holds a caller's limb seeds while its reads run: inside
 * `within` the scope's body reads its limbs' seeds, a held `null` and a limb
 * not held read as none, another body reads none; an inner scope shadows the
 * outer one and the outer is restored on return and on a throw; outside any
 * scope nothing is held.
 *
 * Two bodies are built whole (`humanFixtureBody`), each call a new record, so
 * the scope tells them apart by identity.
 *
 * Scenarios:
 *
 * 1. Inside a scope: the left arm's seed, the right arm's null as none, the left
 *    leg not held, another body none.
 * 2. An inner scope's seed inside, the outer's again after it returns and after it
 *    throws.
 * 3. Outside, none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines body-identity seed scoping, null and missing seeds and restoration through nested calls and throws.
 * @evidence contracts/development/testing.md#behavioral-verification Runs two prepared body identities through an outer scope, callback scopes with replacement seed and a thrown error.
 * @evidence contracts/development/testing.md#independent-expectations Only the matching body and limb may read a supplied seed. Inner and outer cases have distinct seed values and the outside read is empty.
 */
export async function test_motions_posture_limb_incumbent(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const other: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const seed: IAutoMovieSwivelSeed = { branch: 0, swivel: 10 };
  const inner: IAutoMovieSwivelSeed = { branch: 1, swivel: -20 };
  const outer: HumanLimbIncumbent.IScope = {
    body,
    seeds: { leftArm: seed, rightArm: null },
  };

  // 1. Inside a scope.
  TestValidator.predicate(
    "the scope's seeds",
    HumanLimbIncumbent.within(
      outer,
      (): boolean =>
        HumanLimbIncumbent(body, "leftArm") === seed &&
        HumanLimbIncumbent(body, "rightArm") === undefined &&
        HumanLimbIncumbent(body, "leftLeg") === undefined &&
        HumanLimbIncumbent(other, "leftArm") === undefined,
    ),
  );

  // 2. Nesting.
  TestValidator.predicate(
    "an inner scope shadows and is undone",
    HumanLimbIncumbent.within(outer, (): boolean => {
      const shadowed: boolean = HumanLimbIncumbent.within(
        { body, seeds: { leftArm: inner } },
        (): boolean => HumanLimbIncumbent(body, "leftArm") === inner,
      );
      const returned: boolean = HumanLimbIncumbent(body, "leftArm") === seed;
      const thrown: boolean = throwsError((): unknown =>
        HumanLimbIncumbent.within({ body, seeds: {} }, (): never => {
          throw new Error("read failed");
        }),
      );
      return (
        shadowed &&
        returned &&
        thrown &&
        HumanLimbIncumbent(body, "leftArm") === seed
      );
    }),
  );

  // 3. Outside.
  TestValidator.equals(
    "nothing held outside",
    HumanLimbIncumbent(body, "leftArm"),
    undefined,
  );
}
