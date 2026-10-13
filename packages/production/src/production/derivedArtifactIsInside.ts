import path from "node:path";

/**
 * path.relative admits equality or a nonabsolute relative path that neither equals .. nor begins a parent segment.
 *
 * @evidence contracts/common.md#principled-implementation path.relative admits equality or a nonabsolute relative path that neither equals .. nor begins a parent segment.
 * @evidence contracts/common.md#clear-and-simple-design Physical resolution and realpath readers share platform-native lexical containment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The comparison is lexical after the caller's realpath observation, not an independent physical identity or case-normalization certificate.
 * @evidence contracts/common.md#meaningful-documentation States inclusive-root containment and Windows/POSIX separator behavior through node:path.
 * @evidence contracts/performance.md#efficient-algorithms Relative path computation inspects root/target text and allocates one temporary string.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses current caller-supplied root and target values directly without a path verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no filesystem object or handle is retained.
 */
export const derivedArtifactIsInside: (root: string, candidate: string) => boolean = (root: string, candidate: string): boolean => {
    const relative: string = path.relative(root, candidate);
    return (relative === "" ||
        (path.isAbsolute(relative) === false &&
            relative !== ".." &&
            relative.startsWith(`..${path.sep}`) === false));
};
