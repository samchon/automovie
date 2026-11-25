import type { BigIntStats } from "node:fs";
import * as fs from "node:fs/promises";

import { hashAutoMovieFile } from "./hashAutoMovieFile";

/**
 * Reuse a media digest inside one verification while the file's filesystem
 * identity stays unchanged. A file modified during a read is unobserved.
 *
 * @returns A reader local to the verification that created it.
 */
export function createAutoMovieVerificationMediaHash(): (
  file: string,
) => Promise<string> {
  const cache: Map<string, { stamp: string; digest: string }> = new Map();
  return async (file: string): Promise<string> => {
    const before: string = await fingerprint(file);
    const retained: { stamp: string; digest: string } | undefined =
      cache.get(file);
    if (retained?.stamp === before) return retained.digest;
    const digest: string = await hashAutoMovieFile(file);
    if ((await fingerprint(file)) !== before)
      throw new Error(
        `The media file changed while verifying its bytes: ${file}. Run verify again.`,
      );
    cache.set(file, { stamp: before, digest });
    return digest;
  };
}

/** Compare actual identity, size and both high-resolution change clocks. */
async function fingerprint(file: string): Promise<string> {
  const info: BigIntStats = await fs.stat(file, { bigint: true });
  return `${info.dev}:${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}`;
}
