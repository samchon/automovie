/**
 * Durable storage for stage artifacts addressed by `composeAutoMovieArtifactKey`.
 *
 * The engine resolver owns reuse and repair semantics while the host owns
 * storage access: createAutoMovieHttpArtifactStore uses HTTP and tests can
 * use an in-memory adapter. Each entry is the artifact's
 * bytes plus the content digest recorded when it was written, so a reader can
 * detect a truncated, replaced or corrupted entry instead of trusting that a
 * file exists. Storage promise rejections propagate through the resolver;
 * missing entries are represented by undefined rather than a rejection.
 */
export interface IAutoMovieArtifactStore {
  /**
   * The entry written under `key`, or `undefined` when there is none.
   * Missing entries resolve undefined; malformed keys, missing digest metadata and storage failures reject. The resolver propagates storage failures and only repairs entries it can read and hash.
   */
  read(key: string): Promise<IAutoMovieArtifactStore.IEntry | undefined>;

  /**
   * Replace the entry under `key` atomically, so a reader sees the old or the new entry, never a part.
   * Keep entry.bytes stable until the promise settles. The store owns any
   * retained copy; later caller mutation must not alter the stored generation.
   */
  write(key: string, entry: IAutoMovieArtifactStore.IEntry): Promise<void>;

  /**
   * Delete the entry under `key`; removing an absent key succeeds.
   */
  remove(key: string): Promise<void>;

  /**
   * The `sha256:` content digest of `bytes`, the same value every store computes.
   * Read bytes without mutation; the caller keeps them stable until settlement.
   * The result is lowercase hexadecimal after the prefix and hashes every byte.
   */
  digest(bytes: Uint8Array): Promise<string>;
}

/**
 * Storage entry carried between the artifact resolver and host storage adapters.
 */
export namespace IAutoMovieArtifactStore {
  /**
   * One stored artifact generation. A successful read gives the caller its own mutable byte buffer; the recorded digest may disagree with corrupted bytes, which resolveAutoMovieArtifact detects before reuse.
   */
  export interface IEntry {
    /**
     * Artifact bytes owned by the reader after read. During write the caller keeps them stable until the promise settles; the store must preserve the written generation independently of later caller mutation.
     */
    bytes: Uint8Array;

    /**
     * Recorded lowercase sha256: content digest. The resolver compares it with a fresh digest of bytes; read does not itself certify that they match.
     */
    digest: string;
  }
}
