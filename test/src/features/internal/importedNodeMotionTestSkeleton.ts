import type { IAutoMovieSkeleton } from "@automovie/interface";

import { importedNodeMotionTestTransform as transform } from "./importedNodeMotionTestTransform";

/**
 * Preserve the existing two-bone imported-source rig and rest offsets.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the same source-rig hips/spine hierarchy to the maintained lowering unit, including null constraints and original bone order.
 * @evidence contracts/testing.md#independent-expectations Literal one-metre hips and half-metre spine offsets are authored inputs; the consumer independently states rest-relative results rather than reading an expected pose here.
 * @evidence contracts/testing.md#distinguishing-cases Fresh copies support all original missing/duplicate/malformed rest and explicit characterization twins without changing the rig or adding anatomy claims.
 * @evidence contracts/testing.md#execution-ownership Each call returns fresh bones/rest records through the same transform owner, retains no global state and opens no file, process, renderer, browser or GPU.
 */
export function importedNodeMotionTestSkeleton(): IAutoMovieSkeleton {
  return {
    id: "source-rig",
    bones: [
      { bone: "hips", parent: null, rest: transform(0, 1, 0), constraint: null },
      { bone: "spine", parent: "hips", rest: transform(0, 0.5, 0), constraint: null },
    ],
  };
}
