import { legacyImporterReadPhysicalFile } from "./legacyImporterReadPhysicalFile";

/**
 * Return whether a required current revision.lock read equals the expected UTF-8 token. Any read failure becomes mismatch under the outer assertion's established refusal contract.
 *
 * @evidence contracts/common.md#principled-implementation Uses the same physical/owned read boundary as inventory and compares the complete decoded token without path-age or PID shortcuts.
 * @evidence contracts/common.md#clear-and-simple-design Owns the boolean read projection while the outer lock assertion supplies the refusal message and acquisition remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read failure never becomes absence or permission to publish; it returns false without inventing a compatible token.
 * @evidence contracts/common.md#meaningful-documentation Documents equality and failure-as-mismatch, including that this API suppresses the read's detailed cause for its enclosing refusal.
 * @evidence contracts/performance.md#efficient-algorithms Reads and compares T token bytes with O(T) temporary buffer/string work plus native descriptor latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the expected token but reads current bytes afresh for each assertion rather than caching resident ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned-file reader scopes descriptors; temporary token bytes expire on return and no lease or handle is retained by this boolean projection.
 */
export const legacyImporterReadLegacyLockMatches: (root: string, lockToken: string) => boolean = (root: string, lockToken: string): boolean => {
  try {
    const bytes: Uint8Array<ArrayBufferLike> | null = legacyImporterReadPhysicalFile(root, "revision.lock", true);
    return bytes !== null && Buffer.from(bytes).toString("utf8") === lockToken;
  } catch {
    return false;
  }
};
