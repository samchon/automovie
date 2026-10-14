import { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { type IAutoMovieSkeleton } from "@automovie/interface";
import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { qclose } from "../internal/qclose";
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
 * Articulating a bone must rotate its whole subtree, not just itself: the
 * defining property of forward kinematics. This pins that a parent's rotation
 * propagates into its children's world positions.
 *
 * Scenario: twist the chest 90° about +Y. The chest's own local rotation
 * becomes Y90, and its child the leftUpperArm, whose rest offset is the local
 * +X vector (0.2,0,0), swings a quarter turn to −Z, so its world position moves
 * from (0.2,1.4,0) at rest to (0,1.4,−0.2).
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves a chest quarter-turn and checks its local rotation plus a child's displaced world position; rotating only the parent record without carrying its subtree fails.
 * @evidence contracts/testing.md#independent-expectations Right-hand Y90 maps the authored plus-X 0.2 offset to minus-Z 0.2 while preserving chest height 1.4. The local quaternion is independently stated by half-angle components, without using the product constructor as expected output.
 * @evidence contracts/testing.md#distinguishing-cases This nonidentity-parent case complements unarticulated rest and root-translation entries; it does not establish every bone/order, scale propagation or malformed graph behavior.
 * @evidence contracts/testing.md#execution-ownership This exported runner entry directly invokes portable FK source on the existing conventional skeleton, with no renderer or graphical host; the checked subtree coordinates are numerical results only.
 */
export function test_kinematics_resolve_articulation(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const posed: IAutoMovieResolvedBone[] = resolvePose(
    makePose([joint("chest", { twist: 90 })]),
    skeleton,
  );

  TestValidator.predicate(
    "chest local rotation == Y90",
    qclose(at(posed, "chest").localRotation, {
      x: 0,
      y: Math.SQRT1_2,
      z: 0,
      w: Math.SQRT1_2,
    }),
  );
  TestValidator.predicate(
    "child arm swings with chest twist",
    vclose(at(posed, "leftUpperArm").worldPosition, { x: 0, y: 1.4, z: -0.2 }),
  );
}
