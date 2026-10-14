import { acquireProductionRootNamespace, assertProductionRootNamespaceLease, releaseProductionRootNamespace } from "../production/rootNamespaceLock";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";
import type { IAutoMovieProductionRootNamespaceLease } from "../production/IAutoMovieProductionRootNamespaceLease";

/**
 *
 * @evidence contracts/common.md#principled-implementation An existing root lease must match instance device/inode and remain valid before and after the synchronous callback.
 * @evidence contracts/common.md#clear-and-simple-design Supplies the repeated assertion closure shared by resident reads and mutations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite checks do not pin every future pathname or undo effects before a closing refusal.
 * @evidence contracts/common.md#meaningful-documentation States identity mismatch, result transfer and closing-fence effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes paired acquisition, current token/identity reads and full callback cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested scopes share exact lock depth; fresh assertions renew continuing authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts retirement of this acquired level; native cleanup can retain namespace fences, and independent callback resources remain callback-owned.
 */
export function autoMovieProjectWithRootNamespace<T>(_project: IAutoMovieProjectState, task: (assertNamespace: () => void) => T): T {
    const lease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(_project.root);
    try {
        const assertNamespace: () => void = (): void => {
            if (lease.device !== _project.rootDevice || lease.inode !== _project.rootInode)
                throw new Error(`AutoMovie project root "${_project.root}" changed physical identity. Discard this project handle and open the physical project again.`);
            assertProductionRootNamespaceLease(lease);
        };
        assertNamespace();
        const result: T = task(assertNamespace);
        assertNamespace();
        return result;
    }
    finally {
        releaseProductionRootNamespace(lease);
    }
}
