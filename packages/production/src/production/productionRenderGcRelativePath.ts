

/**
 * Admit the GC planner's supported relative slash pathname profile.
 *
 * @evidence contracts/common.md#principled-implementation Rejects blank, backslash, rooted/drive and empty/dot/parent segments before returning the same string; this is lexical admission on host-supplied paths.
 * @evidence contracts/common.md#clear-and-simple-design Publication, retained and candidate paths share one rule instead of separate normalizers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No namespace or file is observed, and this profile does not exclude every reserved host character or independently prove portability.
 * @evidence contracts/common.md#meaningful-documentation Defines exact rejection rules and unchanged successful spelling rather than silently repairing paths.
 * @evidence contracts/performance.md#efficient-algorithms Scans/splits P path characters and segments, with temporary segment storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned same string supplies reference/candidate sets; no namespace verdict is memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the admitted string transfers, with no bytes, descriptors or tasks acquired.
 */
export function productionRenderGcRelativePath(value: string): string {
    if (value.trim().length === 0 ||
        value.includes("\\") ||
        value.startsWith("/") ||
        /^[A-Za-z]:/.test(value) ||
        value
            .split("/")
            .some((segment: string): boolean => segment.length === 0 || segment === "." || segment === ".."))
        throw new Error(`Render GC path "${value}" must be one canonical relative POSIX path.`);
    return value;
}
