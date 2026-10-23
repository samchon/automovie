import type fs from "node:fs";

/**
 * Compares regular files by OS device/inode metadata, independently of Evidence IDs.
 *
 * A filesystem without inode identities may use the captured physical path only
 * for a file with no other hard links. Multiple links without an inode fail
 * closed because their ownership cannot be established from paths or bytes.
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
