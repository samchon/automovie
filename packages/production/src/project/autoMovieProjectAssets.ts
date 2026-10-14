import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh returns a copied asset-path array in registration order.
 * @evidence contracts/common.md#clear-and-simple-design Callers cannot edit the retained index through this getter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration proves neither binary existence nor unchanged bytes.
 * @evidence contracts/common.md#meaningful-documentation States fresh-array ownership and registration order.
 * @evidence contracts/performance.md#efficient-algorithms Includes revision/manifest reads and A-reference copying.
 * @evidence contracts/performance.md#reuse-equivalent-work Current admitted mirror supplies the copy; old getter results are not current evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted and may retain fences on native failure; callers own the copy and the instance retains its mirror.
 */
export function autoMovieProjectAssets(_project: IAutoMovieProjectState): string[] {
    return _project.withRootNamespace((): string[] => {
        _project.synchronizeResidentState();
        return [..._project.manifest.assets];
    });
}
