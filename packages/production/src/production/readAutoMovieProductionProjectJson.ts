import path from "node:path";
import { assertAutoMovieProductionProjectRegularFile } from "./assertAutoMovieProductionProjectRegularFile";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";

/**
 * Read one optional physically admitted project JSON record.
 *
 * @evidence contracts/common.md#principled-implementation Admits an existing regular in-root target, reads through the owned-file descriptor/ancestry guard and parses through duplicate-aware structured JSON; native ENOENT represents an absent record, while parser refusal gains the owning file's correction context.
 * @evidence contracts/common.md#clear-and-simple-design Composes file shape, guarded byte access and JSON ingress; project registry, revision and keyed design readers separately decide whether absence is valid and which schema applies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing native files are not replaced with fabricated records, and duplicate JSON members cannot silently overwrite. The ENOENT branch assumes the owned native reader throws errno-bearing errors; arbitrary null failures from a custom filesystem are outside that assumption.
 * @evidence contracts/common.md#meaningful-documentation Any ENOENT from the owned read becomes undefined, including disappearance during a later identity recheck; other read failures propagate. The result remains untyped JSON requiring the caller's schema, and parser refusal receives the file address.
 * @evidence contracts/performance.md#efficient-algorithms Includes regular-path and owned descriptor/ancestry checks plus strict decoding and structured parsing of B bytes; repeated numeric suffix slicing can add quadratic text-copy work. The returned tree and parse buffers scale with the input, and no repeated full file read occurs here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call acquires current filesystem bytes and identities; a quiet path or earlier JSON tree does not establish the observation required by read/commit guards.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned-file reader acquires descriptors and attempts cleanup, propagating close failures without certifying host release; this wrapper retains temporary bytes until parsing and transfers the JSON tree or attributed error to its caller. No byte-size bound, cross-call record store or task is introduced.
 */
export function readAutoMovieProductionProjectJson(rootReal: string, file: string): unknown {
  assertAutoMovieProductionProjectRegularFile(rootReal, file);
  let bytes: Uint8Array;
  try { bytes = readAutoMovieProductionOwnedFile({ root: rootReal, directory: path.dirname(file), relative: path.basename(file) }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
  try { return parseAutoMovieStructuredJson({ record: path.basename(file), bytes }); }
  catch (error) { throw new Error(`Invalid AutoMovie JSON "${file}": ${String(error)}. Correct the file before continuing.`); }
}
