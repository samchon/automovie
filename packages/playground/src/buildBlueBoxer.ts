import type { IAutoMovieModel, IAutoMovieSkeleton } from "@automovie/interface";

import { buildSparBoxer } from "./buildSparBoxer";

/**
 * Build the sparring page's blue actor using its conventional fixed RGB palette and boxerBlue identity.
 *
 * @evidence contracts/common.md#principled-implementation The shared tint producer retains the stick rig/parts while supplying the blue corner's model and skeleton with one actual actor identity.
 * @evidence contracts/common.md#clear-and-simple-design This existing actor role delegates assembly to the shared producer and leaves placement/clip playback in the sparring page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored blue palette and actor naming establish neither measured material properties nor clinical/physical boxing validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the consumed page role, conventional color and matching identity.
 * @evidence contracts/performance.md#efficient-algorithms The constant wrapper invokes one fixed-size stick/material assembly; later tessellation and upload remain viewer costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh actor remains independent from the red actor and previous calls; no mutable model result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns returned actor data and GPU disposal after upload; this function retains no handle or running task.
 */
export function buildBlueBoxer(): {
  /** Blue actor's rig wrapper, shared with model.skeleton and independently constructed from the red actor. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh blue-tinted document; the consuming page owns its later realized resources. */
  model: IAutoMovieModel;
} {
  return buildSparBoxer("boxerBlue", [0.2, 0.34, 0.62]);
}
