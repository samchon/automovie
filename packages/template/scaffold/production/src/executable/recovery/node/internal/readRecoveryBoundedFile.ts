import fs from "node:fs";

/*
 * Read one regular file under an explicit byte bound and close the descriptor
 * on every path. A final byte probe detects growth beyond the original admitted
 * size. Concurrent replacement or mutation is not an immutable-source
 * guarantee; callers bind complete returned bytes to their expected hash before
 * using them.
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
