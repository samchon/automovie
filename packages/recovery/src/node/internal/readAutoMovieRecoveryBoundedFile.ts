import fs from "node:fs";

/**
 * Read one regular file under an explicit byte bound and close the descriptor on
 * every path. A final byte probe detects growth beyond the original admitted size.
 * Concurrent replacement or mutation is not an immutable-source guarantee; callers
 * bind complete returned bytes to their expected hash before using them.
 *
 * @evidence contracts/common.md#principled-implementation Descriptor metadata admits a finite regular-file size before allocation, exact reads detect truncation and a one-byte probe detects appended content before transfer.
 * @evidence contracts/common.md#clear-and-simple-design This host helper owns only bounded file acquisition and cleanup while format and hash admission remain with command callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unbounded readFile, partial prefix acceptance, retry on changed content or fallback path supplies bytes.
 * @evidence contracts/common.md#meaningful-documentation States regular-file and byte-budget admission, concurrent-mutation limitation, complete-byte caller hashing and guaranteed descriptor cleanup.
 * @evidence contracts/performance.md#efficient-algorithms Reads B admitted bytes once with O(B) caller-owned output and a one-byte probe; allocation never follows an unadmitted growing file size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each explicit file acquisition has its own byte effect and is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One descriptor is acquired after budget validation and closed in finally on success or failure; at most maxBytes plus one probe byte is allocated by this helper.
 */
export function readAutoMovieRecoveryBoundedFile(
  file: string,
  maxBytes: number,
): Buffer {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new Error("A positive safe integer maxInputBytes is required");
  const descriptor: number = fs.openSync(file, "r");
  try {
    const stat: fs.Stats = fs.fstatSync(descriptor);
    if (
      !stat.isFile() ||
      !Number.isSafeInteger(stat.size) ||
      stat.size < 1 ||
      stat.size > maxBytes
    )
      throw new Error(
        "Input must be a nonempty regular file within maxInputBytes",
      );
    const bytes: Buffer = Buffer.alloc(stat.size);
    let offset: number = 0;
    while (offset < bytes.length) {
      const read: number = fs.readSync(
        descriptor,
        bytes,
        offset,
        bytes.length - offset,
        null,
      );
      if (read === 0)
        throw new Error(
          "Input changed or truncated during bounded acquisition",
        );
      offset += read;
    }
    if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, null) !== 0)
      throw new Error("Input grew during bounded acquisition");
    return bytes;
  } finally {
    fs.closeSync(descriptor);
  }
}
