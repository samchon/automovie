import type { IAutoMovieClip } from "@automovie/interface";

import { importedNodeMotionTestRotation as rotation } from "./importedNodeMotionTestRotation";

/**
 * Preserve the existing one-second pelvis/spine imported-node take.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the original root translation and two rotation tracks to the real lowering unit; caller mutations still target the same ordered track indices.
 * @evidence contracts/testing.md#independent-expectations Literal translation keys and the authored spine quarter turn are input facts; the consumer independently asserts key union, rest-relative motion and refusal categories.
 * @evidence contracts/testing.md#distinguishing-cases Every call recreates the original take for accepted, omitted, duplicated, corrupt and unsupported-channel twins without adding a case or alternate lowering implementation.
 * @evidence contracts/testing.md#execution-ownership Returns fresh caller-owned clip/track/key arrays through the same rotation constructor; it opens no file, host, browser or GPU and retains no global mutation.
 */
export function importedNodeMotionTestClip(): IAutoMovieClip {
  return {
    id: "captured-take",
    name: "Captured take",
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "pelvis-node", path: "translation" },
        times: [0, 1],
        values: [0, 1, 0, 2, 1, 0],
        interpolation: "linear",
      },
      rotation("pelvis-node", [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
      rotation(
        "spine-node",
        [0, 0.5, 1],
        [0, 0, 0, 1, Math.SQRT1_2, 0, 0, Math.SQRT1_2, 0, 0, 0, 1],
      ),
    ],
  };
}
