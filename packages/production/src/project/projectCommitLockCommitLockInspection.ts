import type { projectCommitLockCommitLockSnapshot } from "./projectCommitLockCommitLockSnapshot";
import type { IAutoMovieCommitLockHolder } from "./IAutoMovieCommitLockHolder";

/**
 * Internal survey result retaining holder evidence and the exact file snapshot when available. An unknown holder may still have a readable token; unreadable file evidence has no snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the public holder beside physical token/identity facts required by reclamation; the producing survey maintains their correspondence, which this record type does not fully encode.
 * @evidence contracts/common.md#clear-and-simple-design Allows public inspection to project holder alone while reclamation consumes the stronger paired evidence without running another parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null snapshot prevents transfer even if a holder record exists, and unknown process state never substitutes for absent evidence.
 * @evidence contracts/common.md#meaningful-documentation Explains optional snapshot meaning and the producer-maintained correspondence limit.
 * @evidence contracts/performance.md#efficient-algorithms The record has no computation; descriptor reading and process queries remain charged to the producing survey.
 * @evidence contracts/performance.md#reuse-equivalent-work One current survey is shared between holder projection and that attempt's proof; the type stores no long-lived cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only value records and strings for the caller's current decision; descriptors stay scoped to the snapshot reader.
 * @author Samchon
 */
export interface projectCommitLockCommitLockInspection {
  /** Current owner conclusion, including explicit unknown evidence. */
  holder: IAutoMovieCommitLockHolder;

  /** Exact token/file witness, absent when the file could not be read reliably. */
  snapshot: projectCommitLockCommitLockSnapshot | null;
}
