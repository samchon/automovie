import { isPortableProductionPublicationPath } from "./productionRenderPublicationIdentity";

/**
 * Admit one already canonical portable render publication address.
 *
 * @evidence contracts/common.md#principled-implementation The shared publication predicate refuses backslashes, roots, drives, NUL and noncanonical segments; success preserves the exact input spelling.
 * @evidence contracts/common.md#clear-and-simple-design Admission is separate from later root resolution, physical ownership and receipt validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization repairs a rejected locator or substitutes another publication path.
 * @evidence contracts/common.md#meaningful-documentation Returns the unchanged relative identity or throws before publication addressing.
 * @evidence contracts/performance.md#efficient-algorithms The delegated normalization, segment split and scans cost O(L) in path text with O(L) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Checks each supplied locator freshly; canonical text alone does not establish resident byte equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local path temporaries release on return/refusal; no file or task is acquired.
 */
export function productionProjectCanonicalProductionRenderPath(value: string): string {
    if (isPortableProductionPublicationPath(value) === false)
        throw new Error(`Render publication path "${value}" is not one canonical portable relative path.`);
    return value;
}
