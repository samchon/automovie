import { decodeAutoMovieProjectRevision } from "../project/decodeAutoMovieProjectRevision";
import type { AutoMovieProjectRevisionDecision } from "../project/AutoMovieProjectRevisionDecision";
import { readAutoMovieProductionProjectJson } from "./readAutoMovieProductionProjectJson";

/**
 * Read a physically admitted revision record as its safe integer generation.
 *
 * @evidence contracts/common.md#principled-implementation Delegates current JSON acquisition and revision decoding; missing records retain the decoder's initial-zero policy, while malformed present generations refuse before a mutation can compare or advance them.
 * @evidence contracts/common.md#clear-and-simple-design Projects the shared decoder decision to a project store number or file-attributed refusal; project refresh/commit operations own when the observation is used.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No malformed value is coerced into a counter and no project name changes exhaustion or initial-generation semantics.
 * @evidence contracts/common.md#meaningful-documentation States safe-integer admission, decoder-owned missing policy and invalid-record correction; returning a number does not independently prove subsequent namespace currentness.
 * @evidence contracts/performance.md#efficient-algorithms Includes the guarded JSON read and parse, then the decoder's constant-size revision checks; it scans no design, model or render population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refresh and guarded commit require a fresh resident generation, so no cached counter substitutes for current file/root observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed revision data is local and the number transfers to its caller; JSON reader descriptor lifetime remains delegated, with no counter store or task here.
 */
export function readAutoMovieProductionProjectRevision(rootReal: string, file: string): number {
  const value: unknown = readAutoMovieProductionProjectJson(rootReal, file);
  const decision: AutoMovieProjectRevisionDecision = decodeAutoMovieProjectRevision(value);
  if (decision.state === "invalid") throw new Error(`Invalid production revision "${file}". Restore a non-negative safe integer revision.`);
  return decision.revision;
}
