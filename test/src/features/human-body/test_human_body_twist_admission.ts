import {
  assertHumanBodyRig,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { throwsError } from "../internal/predicates";

/**
 * A joint spreads its twist only as a boolean on a bone with exactly one
 * child joint, the child whose head ends the axis the twist runs along.
 *
 * Scenarios, on the shoulder fixture:
 * 1. The upper arm (one child, the lower arm) admits `true` and `false`.
 * 2. The upper chest (two children, the girdles) and the lower arm (none)
 *    refuse `true` by name.
 * 3. A value that is not a boolean: the builder's schema admission refuses
 *    it first, and the rig admission refuses it by name on its own.
 */
export const test_human_body_twist_admission = (): void => {
  const withSpread = (bone: string, value: unknown) => {
    const { basis } = humanBodyShoulderFixture();
    const joint = basis.joints.find((one) => one.bone === bone)!;
    (joint as { distributeTwist?: unknown }).distributeTwist = value;
    return basis;
  };
  for (const value of [true, false])
    TestValidator.predicate(
      `the upper arm admits ${value}`,
      (() => {
        createHumanBodyBasisBuilder(withSpread("leftUpperArm", value));
        return true;
      })(),
    );
  for (const bone of ["upperChest", "leftLowerArm"])
    TestValidator.predicate(
      `${bone} cannot spread its twist`,
      throwsError(
        () => createHumanBodyBasisBuilder(withSpread(bone, true)),
        "spreads its twist only",
      ),
    );
  TestValidator.predicate(
    "the builder refuses a non-boolean",
    throwsError(() =>
      createHumanBodyBasisBuilder(withSpread("leftUpperArm", 1)),
    ),
  );
  TestValidator.predicate(
    "the rig admission refuses a non-boolean by name",
    throwsError(
      () => assertHumanBodyRig(withSpread("leftUpperArm", 1)),
      "spreads its twist only",
    ),
  );
};
