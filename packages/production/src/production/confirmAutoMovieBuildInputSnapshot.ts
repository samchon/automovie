import type {
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { createAutoMovieBuildInputRaceFailure } from "./createAutoMovieBuildInputRaceFailure";

/**
 * Confirm one non-publishing compilation result through the shared authority.
 *
 * The authority owns lock acquisition, fresh input checks and revision comparison. This boundary returns null when confirmation holds, converts only its generation-race error to the shared structured refusal, and propagates unrelated failures unchanged. Timed and library compilation use one error policy without acquiring independent locks here.
 *
 * @evidence contracts/common.md#principled-implementation The shared project authority confirms both fresh input identity and expected revision under its own fence; only the dedicated generation-race error becomes a structured compile refusal.
 * @evidence contracts/common.md#clear-and-simple-design Timed and library non-publishing compilers share this confirmation policy while the project owns locking and revision observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated authority failures propagate, no independent lock is acquired here and a race is not retried against a different revision.
 * @evidence contracts/common.md#meaningful-documentation States null success, typed-race conversion, shared authority and unrelated-error propagation.
 * @evidence contracts/performance.md#efficient-algorithms This boundary calls one confirmation whose cost includes the authority's locks and fresh input scans; on a race the formatter additionally sorts D diagnostics in O(D log D) comparisons and reads the current revision.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every confirmation must freshly prove currentness and no previous confirmation result is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The authority owns lock lifetime and release on failure; this wrapper retains only attempt references and returns null or transfers the refused output without acquiring handles.
 */
export function confirmAutoMovieBuildInputSnapshot(props: {
  /** Complete attempt findings preserved beside a converted race refusal. */
  diagnostics: IAutoMovieDiagnostic[];

  /** Fresh check of the same declared input closure used for this attempt. */
  inputCurrent: () => boolean;

  /** Candidate input identity reported by a converted refusal. */
  inputFingerprint: string;

  /** Observed revision the authority must still confirm. */
  inputRevision: number;

  /** Shared project authority; this boundary neither reads nor writes files. */
  authority: {
    /** Confirm currentness and expected revision through the authority's existing fences. */
    confirmCurrentSnapshot: (
      current: () => boolean,
      revision: number,
    ) => number;

    /** Observe current revision when formatting a typed input-race failure. */
    revision: () => number;
  };
}): IAutoMovieBuildProjectOutput | null {
  try {
    props.authority.confirmCurrentSnapshot(
      props.inputCurrent,
      props.inputRevision,
    );
    return null;
  } catch (error) {
    if (error instanceof AutoMovieProductionInputRaceError === false)
      throw error;
    return createAutoMovieBuildInputRaceFailure({
      ...props,
      failure: error,
      currentRevision: (): number => props.authority.revision(),
    });
  }
}
