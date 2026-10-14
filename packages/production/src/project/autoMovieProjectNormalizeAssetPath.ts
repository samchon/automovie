import { checkAssetPath } from "./checkAssetPath";

/**
 *
 * @evidence contracts/common.md#principled-implementation The shared path result returns normalized text or throws its exact fault.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the store's throwing API over import's shared nonthrowing policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no path repair, physical admission or platform-hazard exceptions.
 * @evidence contracts/common.md#meaningful-documentation States preserved refusal text and successful normalization.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete L-unit path admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the already computed path/fault result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One string/Error escapes; no handle opens.
 */
export const autoMovieProjectNormalizeAssetPath: (relativePath: string) => string = (relativePath: string): string => {
    const checked: {
        path: string;
    } | {
        fault: string;
    } = checkAssetPath(relativePath);
    if ("fault" in checked)
        throw new Error(checked.fault);
    return checked.path;
};
