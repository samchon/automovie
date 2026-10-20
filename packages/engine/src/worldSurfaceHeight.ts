import { IAutoMovieWorldSurface } from "@automovie/interface";

import { surfaceHeightAt } from "./space/surfaceHeightAt";

/**
 * Evaluate one world surface's height rule at XZ without testing its footprint.
 *
 * @evidence contracts/common.md#principled-implementation Delegation to surfaceHeightAt preserves constant, plane and edge-clamped bilinear arithmetic shared with scene surfaces; validated finite fields and representable derived arithmetic remain prerequisites, not a universal finite-output guarantee.
 * @evidence contracts/common.md#clear-and-simple-design World and scene records use one height implementation, while worldGroundSurface separately selects where a rule applies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Off-lattice heightfields use edge samples and malformed missing samples follow the shared zero fallback; no new admission, walkability test or off-footprint repair is introduced.
 * @evidence contracts/common.md#meaningful-documentation Documents ignored footprint, metre coordinates/output and the shared rule's edge clamping and numeric limitations.
 * @evidence contracts/performance.md#efficient-algorithms One query has constant scalar cost with at most four lattice sample reads, independent of stored grid population.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical height owner is reused across placement, ground validation and oracle queries; no cached height hides changed mutable samples.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number escapes, and the borrowed surface/grid is not retained by this query or attached to a host task.
 */
export const worldSurfaceHeight: (
  surface: IAutoMovieWorldSurface,
  point: { x: number; z: number },
) => number = (
  surface: IAutoMovieWorldSurface,
  point: { x: number; z: number },
): number => surfaceHeightAt(surface, point.x, point.z);
