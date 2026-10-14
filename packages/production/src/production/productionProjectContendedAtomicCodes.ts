

/**
 * Filesystem codes eligible for bounded atomic-step retry on supported hosts.
 * EPERM/EACCES/EBUSY can describe transient target contention, especially on
 * Windows, but can also describe permanent permissions failure; the code alone
 * does not prove transience and exhausting retries preserves the real errors.
 */
export const productionProjectContendedAtomicCodes: ReadonlySet<string> = new Set([
    "EPERM",
    "EACCES",
    "EBUSY",
]);
