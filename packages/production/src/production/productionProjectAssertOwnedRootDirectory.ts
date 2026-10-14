import { productionProjectAcquirePhysicalDirectoryAncestry } from "./productionProjectAcquirePhysicalDirectoryAncestry";
import { productionProjectAssertPhysicalDirectoryAncestry } from "./productionProjectAssertPhysicalDirectoryAncestry";
import { productionProjectAssertRealAncestorInside } from "./productionProjectAssertRealAncestorInside";

import type { IAutoMovieProductionProjectDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";

/**
 * Capture, check real containment, then recheck an owned directory ancestry.
 *
 * @evidence contracts/common.md#principled-implementation Physical ancestry acquisition surrounds realpath containment with a final exact identity recheck, retaining each shared guard's native refusal.
 * @evidence contracts/common.md#clear-and-simple-design The layout guard composes existing observation, real-containment and identity owners in their required order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Realpath-inside alone cannot admit an internal directory alias; sequential checks still do not lock state after return.
 * @evidence contracts/common.md#meaningful-documentation States capture-before-containment ordering, final recheck and separate continuing namespace ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two ancestry walks cost O(D) native observations plus real-ancestor resolution and path-text construction; each phase checks a different premise.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured ancestry is reused as the final check's expected operands while current identities are freshly observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The O(D) snapshot is call-local and released on success/refusal, without a retained descriptor or namespace lease.
 */
export function productionProjectAssertOwnedRootDirectory(projectRootReal: string, directory: string): void {
    const ancestry: IAutoMovieProductionProjectDirectoryAncestry = productionProjectAcquirePhysicalDirectoryAncestry(projectRootReal, directory);
    productionProjectAssertRealAncestorInside(projectRootReal, directory);
    productionProjectAssertPhysicalDirectoryAncestry(ancestry);
}
