import type { BigIntStats } from "node:fs";
import * as fs from "node:fs/promises";

import { hashAutoMovieFile } from "../../hashAutoMovieFile";

/**
 * Reuse a media digest within one verification while the file identity is
 * unchanged.
 */
export function createAutoMovieProductionCheckMediaHash(): (
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
        `The media file changed while verifying its bytes: ${file}. Run check again.`,
      );
    cache.set(file, { stamp: before, digest });
    return digest;
  };
}

async function fingerprint(file: string): Promise<string> {
  const info: BigIntStats = await fs.stat(file, { bigint: true });
  return `${info.dev}:${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}`;
}
