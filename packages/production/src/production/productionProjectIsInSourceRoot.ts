import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectResolveOwnedDirectory } from "./productionProjectResolveOwnedDirectory";

/**
 * Check a resolved candidate against the resolved roots selected by the current source-root configuration.
 *
 * @evidence contracts/common.md#principled-implementation Each configured root passes project-root identity, lexical ownership and existing-ancestor containment checks before realpath and native root-inclusive containment; some stops at the first matching root without adding a final root-kind check.
 * @evidence contracts/common.md#clear-and-simple-design This operation owns configured source-root membership while resolveSourcePath and readSource separately admit module suffixes, target shape and bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No candidate filename bypasses configured roots; an empty source-root list returns false and native root-resolution failures propagate rather than adding a fallback root.
 * @evidence contracts/common.md#meaningful-documentation States resolved-candidate membership and the separate target-read boundary; this function alone does not prove final configured-root directory kind or that a candidate file is resident or safe.
 * @evidence contracts/performance.md#efficient-algorithms For S configured roots, worst-case work is S owned-directory admissions/realpaths and path-length containment checks, stopping on the first match without enumerating source files.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The manifest root population is borrowed but current physical roots are resolved per call; an earlier path verdict cannot replace generation observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each directory pathname and stat observation is temporary, and only a boolean escapes; no root map, descriptor or running task is retained.
 */
export function productionProjectIsInSourceRoot(state: AutoMovieProductionProjectState, candidate: string): boolean {
    return state.manifest_.sourceRoots.some((root: string): boolean => {
        const directory: string = productionProjectResolveOwnedDirectory(state, root);
        return isInside(fileSystem.realpathSync(directory), candidate);
    });
}
