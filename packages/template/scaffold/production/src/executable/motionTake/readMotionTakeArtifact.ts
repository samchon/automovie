import { admitMotionTake } from "@automovie/engine";
import type { IAutoMovieMotionTake } from "@automovie/interface";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { resolveMotionTakePath } from "./resolveMotionTakePath";

/**
 * Read and admit the exact bytes of one production-relative artifact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the file scope and admission of the read bytes.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the engine schema gate for untrusted JSON and computes a digest from the same file read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves the file, reads it and returns the admitted data and digest.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts JSON fields never determine an import or subsequent file read in this operation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the artifact once, then parses and hashes it in linear time.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is the first read of the selected file in the operation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the admitted record and digest, without a retained byte buffer or handle.
 */
export async function readMotionTakeArtifact(
  root: string,
  reference: string,
): Promise<{ take: IAutoMovieMotionTake; sha256: string }> {
  const bytes: Buffer = await readFile(
    await resolveMotionTakePath(root, reference, "read"),
  );
  let raw: unknown;
  try {
    raw = JSON.parse(bytes.toString("utf8"));
  } catch (cause) {
    throw new Error(`take-schema: malformed JSON in ${reference}`, { cause });
  }
  return {
    take: admitMotionTake(raw),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
