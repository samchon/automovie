

/**
 * Check the supported relative slash spelling of a semantic sidecar claim.
 *
 * @evidence contracts/common.md#principled-implementation Requires nonblank, nonabsolute/nondrive spelling without backslashes, empty or dot/parent segments; this lexical predicate does not establish physical ownership.
 * @evidence contracts/common.md#clear-and-simple-design The chunk receipt validator shares one sidecar path predicate independently of byte-fact validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture path is privileged; this profile does not reject every host-reserved character or independently observe links/files.
 * @evidence contracts/common.md#meaningful-documentation Defines the exact supported lexical profile rather than complete cross-platform filename admission.
 * @evidence contracts/performance.md#efficient-algorithms Splits/scans P path characters and segment population, allocating a local segment array.
 * @evidence contracts/performance.md#reuse-equivalent-work One segment list supplies this check; no pathname verdict survives a mutable namespace.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and path segments expire; no byte read, descriptor or task is owned.
 */
export function productionRenderJobValidSemanticPath(candidate: string): boolean {
    const segments: string[] = candidate.split("/");
    return (candidate.trim().length !== 0 &&
        candidate.startsWith("/") === false &&
        candidate.includes("\\") === false &&
        /^[A-Za-z]:/u.test(candidate) === false &&
        segments.every((segment: string): boolean => segment !== "" && segment !== "." && segment !== ".."));
}
