import { reachPose } from "../../../../packages/engine/src/kinematics/reachPose";
import { IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createSkeleton } from "../internal/createSkeleton";
const withRightHand: () => IAutoMovieSkeleton = (): IAutoMovieSkeleton => {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  skeleton.bones.push({
    bone: "rightHand",
    parent: "rightLowerArm",
    rest: {
      translation: { x: -0.25, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  return skeleton;
};

/**
 * `reachPose` receives `side` from runtime harness calls. Unknown strings must
 * not silently fall through to the right arm just because the TypeScript union
 * is erased at runtime.
 *
 * Scenarios:
 *
 * 1. A complete right-arm chain still solves for the valid `"right"` side.
 * 2. An unknown side value returns `null` instead of solving the right arm.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls reachPose with a complete right chain and an erased-union center string, checking nonnull versus null; accidentally treating every nonleft string as right fails.
 * @evidence contracts/testing.md#independent-expectations The supported side set is left/right, so center is invalid independently of solver output. A conventional fixture and reachable target supply the valid neighbor; a nonnull check here does not establish its hand contact or ROM legality.
 * @evidence contracts/testing.md#distinguishing-cases Keeps a valid right side and the unsupported-center negative twin with the same skeleton/target; geometric contact, shell boundaries and ROM admission are owned by reach/reach_rom.
 * @evidence contracts/testing.md#execution-ownership The exported CPU entry is discovered by the test runner and directly calls reach source; its local right-hand completion is a code fixture, with no native solver, browser, GPU or installed Human asset.
 */
export function test_kinematics_reach_side(): void {
  const skeleton: IAutoMovieSkeleton = withRightHand();
  const target: IAutoMovieVector3 = { x: -0.4, y: 1.1, z: 0.2 };

  TestValidator.predicate(
    "valid right side still solves",
    reachPose(skeleton, "right", target) !== null,
  );

  const invalidSide: "left" | "right" = "center" as Parameters<typeof reachPose>[1];
  TestValidator.predicate(
    "invalid side returns null",
    reachPose(skeleton, invalidSide, target) === null,
  );
}
