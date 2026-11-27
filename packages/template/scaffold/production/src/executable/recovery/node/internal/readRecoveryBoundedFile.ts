import fs from "node:fs";

/**
 * Read one regular file under an explicit byte bound and close the descriptor
 * on every path. A final byte probe detects growth beyond the original admitted
 * size. Concurrent replacement or mutation is not an immutable-source
 * guarantee; callers bind complete returned bytes to their expected hash before
 * using them.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Descriptor metadata checks regular-file size before allocation. Exact reads detect truncation and a one-byte probe detects growth before transfer. A finite positive byte ceiling is a caller premise: the current helper and camera command argument readers use comparisons that do not reject NaN or positive infinity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads B bytes once into caller-owned output and probes one more byte. A valid finite maxBytes bounds the allocation by maxBytes plus one probe byte. The helper opens one descriptor after the lower-bound check and closes it in finally on success or failure. Each acquisition has its own file effect. Command callers own format and complete-byte hash admission.
 * @evidence contracts/development/common.md#meaningful-documentation States regular-file and byte-budget admission, concurrent-mutation limitation, complete-byte caller hashing and guaranteed descriptor cleanup.
 */
export function readRecoveryBoundedFile(
  file: string,
  maxBytes: number,
): Buffer {
  if (maxBytes < 1)
    throw new Error("A positive safe integer maxInputBytes is required");
  const descriptor: number = fs.openSync(file, "r");
  try {
    const stat: fs.Stats = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size < 1 || stat.size > maxBytes)
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
