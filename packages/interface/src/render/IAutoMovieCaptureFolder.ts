import type { IAutoMovieCaptureRecord } from "./IAutoMovieCaptureRecord.js";

/**
 * Opened capture storage with explicit ownership of file names and publication
 * order.
 *
 * Before offering this port, the host confirms a requested comparison has a
 * complete record, lists the destination, refuses every foreign entry before
 * deleting any file, and removes only files owned by its previous record.
 * Creating the destination directory may precede that refusal. The root may
 * additionally contain the preserved rounds directory. Callers await each
 * operation in order: claim before writing or external file creation, await all
 * owned writes/removals, then close. A running record owns every claimed name,
 * including names not yet written, so interruption permits a later capture to
 * clean up. A complete record lists surviving successful writes and record.json
 * itself; not every claim must produce a file. Failed cells can therefore
 * coexist with a completed capture.
 *
 * This structural port intentionally admits host implementations other than the
 * concrete AutoMovieRenderCaptureFolder class. It removes that class's private-field
 * admission restriction; it introduces no brand and cannot statically enforce
 * sequencing or filesystem ownership. The render class implements the checks;
 * other hosts must honor the same obligations.
 */
export interface IAutoMovieCaptureFolder {
  /**
   * Destination root or named round path without a trailing slash; path joining
   * uses slash.
   */
  readonly directory: string;
  /** Kept round name, or null for replacement of the unnamed root capture. */
  readonly round: string | null;
  /** Compared round name, or null when no comparison was requested. */
  readonly compare: string | null;
  /**
   * Observations admitted from the completed earlier round before destination
   * cleanup, or null without comparison.
   */
  readonly earlier: IAutoMovieCaptureRecord.IComparison | null;
  /**
   * Compared round directory, or null without comparison. Reads must not mutate
   * it.
   */
  readonly reference: string | null;
  /**
   * Persist a running journal containing the union of claimed names before any
   * corresponding file write. Reject separators, dot/dot-dot, and record.json.
   * Empty input still publishes the current claims.
   */
  claim(names: readonly string[]): Promise<void>;
  /**
   * Replace one previously claimed file; text is UTF-8. Resolve only after
   * storage succeeds, then remember it as written. Reject unclaimed names.
   */
  write(name: string, data: Uint8Array | string): Promise<void>;
  /**
   * Remove a claimed file and its written-list entry. Missing files succeed;
   * unclaimed names reject. The claim remains owned by the running journal.
   */
  remove(name: string): Promise<void>;
  /**
   * Read a plain file name in this destination, or the compared directory when
   * earlier is true. Default false; reject invalid names, unavailable
   * comparison, and storage failures. The folder forwards the host's bytes
   * without cloning; byte sharing follows the storage host's ownership policy.
   */
  read(name: string, earlier?: boolean): Promise<Uint8Array>;
  /**
   * Publish complete metadata after all surviving owned writes finish. Derive
   * state and files from successful writes rather than trusting the supplied
   * metadata; return only after record.json is written. Caller must stop
   * writing after publication; the concrete class has no closed-state guard.
   */
  close(
    record: Omit<
      Extract<
        IAutoMovieCaptureRecord,
        {
          /** Select only successfully published complete capture records. */
          state: "complete";
        }
      >,
      "files" | "state"
    >,
  ): Promise<
    Extract<
      IAutoMovieCaptureRecord,
      {
        /** Select only successfully published complete capture records. */
        state: "complete";
      }
    >
  >;
}
