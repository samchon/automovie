import { resolvePose } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  type IAutoMovieResolvedBone,
  type IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../../../internal/IDENTITY_TRANSFORM";
import { createSkeleton } from "../../../internal/createSkeleton";
import { makePose } from "../../../internal/makePose";
import { vclose } from "../../../internal/vclose";

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
 */
export function test_unit_engine_kinematics_resolve_root(): void {
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
