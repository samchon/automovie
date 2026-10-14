import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectResolveOwnedDirectory } from "./productionProjectResolveOwnedDirectory";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Resolve the selected production's absolute render-output root after current namespace admission.
 *
 * @evidence contracts/common.md#principled-implementation Incarnation and captured namespace checks precede configured render-root project/nearest-ancestor fencing and production-segment containment, preserving the existing native path and refusal order.
 * @evidence contracts/common.md#clear-and-simple-design One root-address operation is shared by capture, repaint, delivery and render reads; their owners separately admit resident directories/files, media and publication authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal root text cannot bypass generation checks; address resolution creates nothing and does not independently establish final directory existence/kind or complete descendant safety.
 * @evidence contracts/common.md#meaningful-documentation Defines absolute production-specific output address and delegated namespace/ancestor refusal; the returned path alone is not a current media or publication verdict.
 * @evidence contracts/performance.md#efficient-algorithms Registry/incarnation record bytes, captured namespace components and configured-root missing ancestor depth drive delegated work; the final path composition scans no render member population.
 * @evidence contracts/performance.md#reuse-equivalent-work Retained production segment and captured generation expectations are shared operands, but each call reobserves current root facts instead of accepting a prior render-root success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Delegated record readers own descriptor cleanup and temporary records/stat/path strings expire; only the root address escapes, without a render cache, byte buffer or capture task.
 */
export function productionProjectRenderRoot(state: AutoMovieProductionProjectState): string {
    productionProjectAssertIncarnation(state);
    return resolveInside(productionProjectResolveOwnedDirectory(state, state.manifest_.renderRoot), state.productionSegment);
}
