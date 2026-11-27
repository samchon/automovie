import * as fs from "node:fs/promises";
import * as path from "node:path";

import { readAutoMovieErrorCode } from "../../file/internal/readAutoMovieErrorCode";

/*
 * Check filesystem identity for two spellings of the same native review path.
 */
export async function sameAutoMovieReviewFile(
  left: string,
  right: string,
): Promise<boolean> {
  if (left === right) return true;
  if (path.relative(left, right) !== "") return false;
  try {
    const [canonicalLeft, canonicalRight]: [string, string] = await Promise.all(
      [fs.realpath(left), fs.realpath(right)],
    );
    return canonicalLeft === canonicalRight;
  } catch (error) {
    const code: unknown = readAutoMovieErrorCode(error);
    if (code === "ENOENT" || code === "ENOTDIR") return false;
    throw error;
  }
}
