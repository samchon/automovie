import { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/** A fresh, empty spring state.
 *
 * @evidence contracts/common.md#principled-implementation Create separate empty maps for previous joint positions, previous centre/chain translations and post-spring reseeding, establishing first-step history absence explicitly.
 * @evidence contracts/common.md#clear-and-simple-design A small factory exposes state lifetime to the scene caller rather than hiding it in resolveFrame globals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fabricated first-step velocity or fixture scene entries are preloaded; stepSpring owns population and admission.
 * @evidence contracts/common.md#meaningful-documentation Docs identify fresh empty state and distinguish the three maps through IAutoMovieSpringState member contracts.
 * @evidence contracts/performance.md#efficient-algorithms Three empty map allocations require O(1) construction; later visited joint/chain population is owned by the stepping lifecycle.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller reuses this state across its scene frames and explicitly replaces it when history is no longer equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The scene caller owns all maps, whose population has no automatic removal bound; construction opens no resource handle or running task.
 */
export const createSpringState: () => IAutoMovieSpringState = (): IAutoMovieSpringState => ({
  prev: new Map(),
  centers: new Map(),
  sprung: new Map(),
});
