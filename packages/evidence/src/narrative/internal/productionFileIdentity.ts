import type fs from "node:fs";

/**
 * Compares regular files by OS device/inode metadata, independently of Evidence IDs.
 *
 * A filesystem without inode identities may use the captured physical path only
 * for a file with no other hard links. Multiple links without an inode fail
 * closed because their ownership cannot be established from paths or bytes.
 *
 * @evidence contracts/common.md#principled-implementation Nonzero device/inode metadata forms a path-independent file identity, detecting hard-link aliases; when inode identity is unavailable, a single-link file may use its captured physical path and multi-link files fail closed.
 * @evidence contracts/common.md#clear-and-simple-design The helper isolates OS identity policy from opaque Evidence source IDs and from capture traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The zero-inode fallback is constrained by actual nlink metadata; it never treats equal content or multiple unverifiable links as independent engineering input.
 * @evidence contracts/common.md#meaningful-documentation The prose states bigint metadata basis, the single-link fallback and unsupported hard-link failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Serializing the fixed-field identity costs the digit/path lengths of metadata or physical input and allocates one string.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This metadata formatter coordinates no reusable requests; capture callers cache the resulting identity for paths within their snapshot.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The helper owns only its returned identity string and acquires no handle, task or retained module state.
 */
export function productionFileIdentity(
  physical: string,
  metadata: fs.BigIntStats,
): string {
  if (metadata.ino !== 0n)
    return JSON.stringify({
      device: String(metadata.dev),
      inode: String(metadata.ino),
    });
  if (metadata.nlink > 1n)
    throw new Error(
      "Support verification cannot establish protected hard-link identity on this filesystem.",
    );
  return JSON.stringify({ physical });
}
