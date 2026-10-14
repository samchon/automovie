import path from "node:path";

/**
 *
 * @evidence contracts/common.md#principled-implementation Backslashes normalize to slashes; empty text, absolute/drive spellings and empty/dot/parent segments return faults.
 * @evidence contracts/common.md#clear-and-simple-design Shares nonthrowing legacy path admission between asset registration and import capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This historical policy does not reject NUL, reserved devices or every Windows filename hazard, nor observe physical containment.
 * @evidence contracts/common.md#meaningful-documentation States normalized-success versus explanatory-fault union and historical policy scope.
 * @evidence contracts/performance.md#efficient-algorithms Scans/splits L path units with O(L) text storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One normalized spelling serves manifest identity; verdicts are not cached across inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned path/fault text scales with input length and belongs to the caller; no filesystem resource is acquired.
 */
export const checkAssetPath: (relativePath: string) => {
    path: string;
} | {
    fault: string;
} = (relativePath: string): {
    path: string;
} | {
    fault: string;
} => {
    const forward: string = relativePath.replace(/\\/g, "/");
    if (forward.trim().length === 0)
        return {
            fault: `asset path must be non-empty text, but was "${relativePath}"`,
        };
    if (path.isAbsolute(relativePath) ||
        /^[A-Za-z]:/.test(relativePath) ||
        forward.startsWith("/"))
        return {
            fault: `asset path must be project-relative, but was "${relativePath}"`,
        };
    const segments: string[] = forward.split("/");
    if (segments.some((segment: string): boolean => segment === "" || segment === ".." || segment === "."))
        return {
            fault: `asset path must not contain empty, "." or ".." segments, but was "${relativePath}"`,
        };
    return { path: segments.join("/") };
};
