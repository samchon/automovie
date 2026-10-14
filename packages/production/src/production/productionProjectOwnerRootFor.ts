import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";

/**
 * Select the first project state, generated or render root containing an already owned mutation target.
 *
 * @evidence contracts/common.md#principled-implementation The three roots are evaluated eagerly in AutoMovie/generated/render order and native root-inclusive containment selects the first match; commitFiles supplies an owned target and applies physical regular-file/ancestry admission afterwards.
 * @evidence contracts/common.md#clear-and-simple-design Transaction staging uses this single ownership-root mapping, while generated/render path operations retain their existing incarnation and configured-directory checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Eager generated and render observations are retained even if the AutoMovie root will match; the non-null assertion assumes a supported owner and supplies no fallback when that caller premise fails.
 * @evidence contracts/common.md#meaningful-documentation Defines priority, eager guard effects and the owned-target premise; this root selection alone does not admit resident bytes or an arbitrary project pathname.
 * @evidence contracts/performance.md#efficient-algorithms Both output-root operations run before at most three containment checks, including their incarnation/physical-directory costs; the fixed root array does not scan any file population.
 * @evidence contracts/performance.md#reuse-equivalent-work State/configured root values are shared inputs, but output roots are reobserved on each call; no earlier ownership result bypasses transaction fencing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The three-path array and delegated guard temporaries are invocation-local; only the selected pathname transfers and no descriptor, cache or task is retained here.
 */
export function productionProjectOwnerRootFor(state: AutoMovieProductionProjectState, file: string): string {
    const roots: string[] = [state.automovieRoot, productionProjectGeneratedRoot(state), productionProjectRenderRoot(state)];
    return roots.find((root: string): boolean => isInside(root, file))!;
}
