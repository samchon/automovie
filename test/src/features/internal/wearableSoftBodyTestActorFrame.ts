import type { IAutoMovieWearableSoftFrame } from "@automovie/engine";

import { wearableSoftBodyTestBone as bone } from "./wearableSoftBodyTestBone";

/**
 * Construct the existing primary-motion frame with shoulder, hips and head snapshots.
 *
 * Absolute step and shoulder x are caller inputs; hips/head remain at their authored literal coordinates and the fixture computes no predicted solver answer.
 *
 * The original actor id, empty node list, bone order and fresh mutable arrays remain unchanged for admission and moving-boundary cases.
 *
 * Returned frame and bone records belong to the caller; no production/viewer host, cache, renderer or native resource is acquired.
 */
export function wearableSoftBodyTestActorFrame(
  step: number,
  shoulderX: number,
): IAutoMovieWearableSoftFrame {
  return {
    step,
    nodes: [],
    actors: [
      {
        actor: "actor",
        bones: [
          bone("leftShoulder", shoulderX, 1),
          bone("hips", 0, 0),
          bone("head", 0, 1),
        ],
      },
    ],
  };
}
