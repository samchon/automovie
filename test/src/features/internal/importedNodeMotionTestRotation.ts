import type { IAutoMovieTrack } from "@automovie/interface";

/**
 * Preserve the existing imported-node rotation-track input.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the unchanged node rotation channel, caller key times/values and linear interpolation to actual imported-motion lowering cases.
 * @evidence contracts/testing.md#independent-expectations The consumer authors quaternion samples and expected clinical results separately; this carrier computes no predicted lowered pose.
 * @evidence contracts/testing.md#distinguishing-cases The same constructor serves the original pelvis/spine, one-time, rotation-only and rest-relative inputs without selecting or dropping cases.
 * @evidence contracts/testing.md#execution-ownership Returns one caller-owned track borrowing the supplied arrays; no file, process, renderer, browser, GPU or foreign-method replacement is acquired.
 */
export function importedNodeMotionTestRotation(
  node: string,
  times: number[],
  values: number[],
): IAutoMovieTrack {
  return {
    channel: { kind: "node", node, path: "rotation" },
    times,
    values,
    interpolation: "linear",
  };
}
