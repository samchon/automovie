import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/**
 * Streams the file's bytes into a lowercase SHA-256 digest and rejects a failed
 * read.
 */
export async function hashAutoMovieFile(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
