import type { Stats } from "node:fs";
import path from "node:path";
import { legacyImporterReadLegacyLockMatches } from "./legacyImporterReadLegacyLockMatches";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * During planning require no resident revision.lock entry; during apply require a physical regular file carrying the caller's exact acquired token. Any mismatch refuses before production publication.
 *
 * @evidence contracts/common.md#principled-implementation Presence excludes unlocked planning, while an expected token must match current physical-file bytes rather than only a path or recorded process ID.
 * @evidence contracts/common.md#clear-and-simple-design One assertion serves snapshot boundaries and separates token expectation from root-namespace acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable or malformed lock is a changed lock, never authorization to proceed, and planning does not adopt a resident token it did not acquire.
 * @evidence contracts/common.md#meaningful-documentation States tokenless planning versus acquired-token apply and the refusal boundary before publication.
 * @evidence contracts/performance.md#efficient-algorithms A fixed stat plus, for held mode, T token-byte reading/comparison drives cost and temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's exact acquired token as a witness and renews current lock bytes at each assertion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no lock; the outer operation owns resident token retirement and the byte reader owns its descriptor cleanup.
 */
export const legacyImporterAssertLegacyLock: (root: string, lockToken?: string) => void = (root: string, lockToken?: string): void => {
  const lock: string = path.join(root, "revision.lock");
  const status: Stats | null = legacyImporterLstatOrNull(lock);
  if (lockToken === undefined) {
    if (status !== null)
      throw new Error(
        `Legacy project commit lock "${lock}" is active. Retry import planning after the resident commit completes.`,
      );
    return;
  }
  const matches: boolean =
    status !== null && status.isSymbolicLink() === false && status.isFile()
      ? legacyImporterReadLegacyLockMatches(root, lockToken)
      : false;
  if (matches === false)
    throw new Error(
      `Legacy project commit lock "${lock}" changed during import apply. No production state was published.`,
    );
};
