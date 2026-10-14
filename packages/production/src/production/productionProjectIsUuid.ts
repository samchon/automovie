

/**
 * Recognize the lowercase canonical UUIDv4 spelling used by stored project identities.
 *
 * @evidence contracts/common.md#principled-implementation Requires a string, four fixed hexadecimal groups plus the final group, version nibble 4 and variant nibble 8/9/a/b; this checks representation rather than randomness or uniqueness.
 * @evidence contracts/common.md#clear-and-simple-design One spelling predicate serves incarnation and repaint identity admission without repeating slightly different regular expressions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No uppercase spelling, other UUID version or malformed value is silently normalized, and no project-specific identity is accepted outside the same pattern.
 * @evidence contracts/common.md#meaningful-documentation States canonical lowercase version/variant requirements and the distinction between a recognized token and a proven unique generation.
 * @evidence contracts/performance.md#efficient-algorithms Performs a type check and one anchored fixed-format regex, with no population traversal or allocation proportional to project size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar spelling check has no effectful/acquired result to share and no cross-request UUID cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean narrowing result without retaining the supplied string or acquiring a descriptor, lock or task.
 */
export function productionProjectIsUuid(value: unknown): value is string {
    return typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value);
}
