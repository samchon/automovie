import type { IAutoMovieModel, IAutoMovieSkeleton } from "@automovie/interface";

import { buildSparBoxer } from "./buildSparBoxer";

/**
 * Build the sparring page's red actor using its conventional fixed RGB palette and boxerRed identity.
 *
 * @evidence contracts/common.md#principled-implementation The shared stick-figure tint producer supplies unchanged rig/parts and one matching model/skeleton identity for the red corner's actual page consumer.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-role wrapper names the actor without duplicating model assembly, scene placement or animation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The palette and role are authored demonstration constants, not measured skin properties or proof of valid boxing mechanics.
 * @evidence contracts/common.md#meaningful-documentation The comment names the page role, fixed palette and actor identity.
 * @evidence contracts/performance.md#efficient-algorithms Wrapper work is constant and retains the shared producer's fixed model/material traversal plus the viewer's later upload cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call produces a fresh mutable actor; this fixed wrapper caches no model or frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned data belongs to the page, which owns eventual GPU uploads/disposal; this wrapper acquires no renderer, worker or timer.
 */
export function buildRedBoxer(): {
  /** Red actor's rig wrapper, shared with model.skeleton and independently constructed from the blue actor. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh red-tinted document; the consuming page owns its later realized resources. */
  model: IAutoMovieModel;
} {
  return buildSparBoxer("boxerRed", [0.66, 0.18, 0.18]);
}
