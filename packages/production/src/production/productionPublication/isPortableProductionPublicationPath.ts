import path from "node:path";

/**
 * Check the supported normalized relative slash spelling for publication paths.
 *
 * @evidence contracts/common.md#principled-implementation Rejects empty, backslash, NUL, rooted/drive and dot/parent segments and requires POSIX normalization to preserve the exact supplied spelling.
 * @evidence contracts/common.md#clear-and-simple-design Project publication addressing and final-delivery file checks share this lexical path profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This profile does not reject every Windows-reserved character or establish physical ownership, absence of links or a filesystem snapshot.
 * @evidence contracts/common.md#meaningful-documentation Defines exact slash/path rejection and unchanged successful identity rather than silently normalizing a different address.
 * @evidence contracts/performance.md#efficient-algorithms Scans P code units, normalizes the whole string and splits its segments; temporary normalized text and segment arrays scale with P.
 * @evidence contracts/performance.md#reuse-equivalent-work The same profile serves both callers without retaining a pathname verdict across namespace changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean transfers; temporary path data expires and no file handle or task is acquired.
 */
export const isPortableProductionPublicationPath: (value: string) => boolean = (value: string): boolean => value.length !== 0 &&
    value.includes("\\") === false &&
    value.includes("\0") === false &&
    value.startsWith("/") === false &&
    /^[A-Za-z]:/u.test(value) === false &&
    path.posix.normalize(value) === value &&
    value
        .split("/")
        .every((segment: string): boolean => segment.length !== 0 && segment !== "." && segment !== "..");
