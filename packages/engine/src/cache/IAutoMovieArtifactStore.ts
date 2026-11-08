/**
 * Durable storage for stage artifacts addressed by `composeAutoMovieArtifactKey`.
 *
 * The engine owns the semantics and never touches storage itself: a Node
 * production uses a directory store (Render's
 * `createAutoMovieDirectoryArtifactStore`), a browser page uses an HTTP store
 * backed by the same directory, a test uses a map. Each entry is the artifact's
 * bytes plus the content digest recorded when it was written, so a reader can
 * detect a truncated, replaced or corrupted entry instead of trusting that a
 * file exists (Houdini TOPs documents the opposite as a pitfall).
 *
 * @evidence contracts/development/design.md#principled-representation Represents a content-verified key-value store: keys are composed `sha256:` strings, values are owned bytes with their recorded `sha256:` content digest, and the digest function belongs to the store so each host uses its native hash (Node crypto, SubtleCrypto) while producing the same FIPS 180-4 value.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns the port because resolveAutoMovieArtifact is the one consumer that reads, writes, removes and digests; directory, HTTP and in-memory stores implement it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing names a stage, a file layout or a transport.
 * @evidence contracts/development/common.md#meaningful-documentation States ownership, the recorded-digest invariant, absence semantics and failure effects of each member.
 */
export interface IAutoMovieArtifactStore {
  /**
   * The entry written under `key`, or `undefined` when there is none.
   * Rejects only for a storage failure, never for a missing entry.
   */
  read(key: string): Promise<IAutoMovieArtifactStore.IEntry | undefined>;

  /** Replace the entry under `key` atomically, so a reader sees the old or the new entry, never a part. */
  write(key: string, entry: IAutoMovieArtifactStore.IEntry): Promise<void>;

  /** Delete the entry under `key`; removing an absent key succeeds. */
  remove(key: string): Promise<void>;

  /** The `sha256:` content digest of `bytes`, the same value every store computes. */
  digest(bytes: Uint8Array): Promise<string>;
}
export namespace IAutoMovieArtifactStore {
  /** One stored artifact. */
  export interface IEntry {
    /** The artifact's bytes, owned by the reader after `read`. */
    bytes: Uint8Array;

    /** `sha256:` content digest of `bytes`, recorded when the entry was written. */
    digest: string;
  }
}
