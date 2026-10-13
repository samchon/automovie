import path from "node:path";
import { derivedArtifactIsCanonicalProjectPath } from "./derivedArtifactIsCanonicalProjectPath";
import { derivedArtifactIsInside } from "./derivedArtifactIsInside";

/**
 * Declared canonical relative spelling is resolved segmentwise and a path.relative containment check prevents lexical root escape.
 *
 * @evidence contracts/common.md#principled-implementation Declared canonical relative spelling is resolved segmentwise and a path.relative containment check prevents lexical root escape.
 * @evidence contracts/common.md#clear-and-simple-design One resolver keeps ledger, basis and output path composition consistent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lexical containment is not a symlink or physical identity certificate; physical read/write owners perform those observations separately.
 * @evidence contracts/common.md#meaningful-documentation States invalid spelling and escaped-root throws without creating directories or files.
 * @evidence contracts/performance.md#efficient-algorithms Path normalization/resolution inspects L path units and allocates resolved/relative strings.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the shared canonical path predicate; no resolution cache substitutes for later physical observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned absolute string; temporary path text expires and no handle is acquired.
 */
export const derivedArtifactResolveCanonical: (root: string, relative: string) => string = (root: string, relative: string): string => {
    if (derivedArtifactIsCanonicalProjectPath(relative) === false)
        throw new Error(`Path "${relative}" is not canonical and project-relative.`);
    const resolved: string = path.resolve(root, ...relative.split("/"));
    if (derivedArtifactIsInside(root, resolved) === false)
        throw new Error(`Path "${relative}" escapes project root "${root}".`);
    return resolved;
};
