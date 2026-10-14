import { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { type IAutoMovieSkeleton } from "@automovie/interface";
import { IDENTITY_TRANSFORM } from "../internal/IDENTITY_TRANSFORM";
import { createSkeleton } from "../internal/createSkeleton";
import { makePose } from "../internal/makePose";
import { vclose } from "../internal/vclose";

const at: (
  rs: IAutoMovieResolvedBone[],
  b: AutoMovieHumanoidBone,
) => IAutoMovieResolvedBone = (
  rs: IAutoMovieResolvedBone[],
  b: AutoMovieHumanoidBone,
): IAutoMovieResolvedBone => {
  const r: IAutoMovieResolvedBone | undefined = rs.find(
    (x: IAutoMovieResolvedBone): boolean => x.bone === b,
  );
  if (r === undefined) throw new Error(`bone ${b} not resolved`);
  return r;
};

/**
 * A pose's root translation seeds the hierarchy walk. This pure-translation
 * fixture checks that both the hips and a lower-arm descendant move with it.
 *
 * Scenario: a root translation of (+1,0,0) shifts every bone's world position
 * by +1 on X: hips from (0,1,0) to (1,1,0), and the leftLowerArm from
 * (0.5,1.4,0) to (1.5,1.4,0).
 *
 * @evidence contracts/testing.md#behavioral-verification Applies a plus-X root translation and checks both root and descendant world positions; ignoring the root or applying it twice fails.
 * @evidence contracts/testing.md#independent-expectations Authored rest hips(0,1,0) and lower-arm(0.5,1.4,0) plus root(1,0,0) determine the two literal expected positions without consulting an unshifted FK result.
 * @evidence contracts/testing.md#distinguishing-cases This pure translation complements untransformed rest and rotated-parent entries; it does not independently check arbitrary root rotation/scale or every descendant.
 * @evidence contracts/testing.md#execution-ownership This exported runner entry directly calls portable FK on existing conventional code fixtures; numeric world positions are checked without a renderer, graphics context or real asset installation.
 */
export function test_kinematics_resolve_root(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const shifted: IAutoMovieResolvedBone[] = resolvePose(
    makePose([], { ...IDENTITY_TRANSFORM, translation: { x: 1, y: 0, z: 0 } }),
    skeleton,
  );
  TestValidator.predicate(
    "root shift moves hips",
    vclose(at(shifted, "hips").worldPosition, { x: 1, y: 1, z: 0 }),
  );
  TestValidator.predicate(
    "root shift moves leftLowerArm",
    vclose(at(shifted, "leftLowerArm").worldPosition, { x: 1.5, y: 1.4, z: 0 }),
  );
}
