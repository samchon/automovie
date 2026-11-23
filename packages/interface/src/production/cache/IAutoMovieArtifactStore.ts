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
 *
 * @evidence contracts/development/design.md#principled-representation Represents a content-verified key-value store: keys are composed `sha256:` strings, values are owned bytes with their recorded `sha256:` content digest, and the digest function belongs to the store so each host uses its native hash (Node crypto, SubtleCrypto) while producing the same FIPS 180-4 value.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieArtifactStore owns the port consumed by resolveAutoMovieArtifact; the HTTP adapter and in-memory test stores provide read, write, remove and digest without exposing host handles to the resolver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing names a stage, a file layout or a transport.
 * @evidence contracts/development/common.md#meaningful-documentation States ownership, the recorded-digest invariant, absence semantics and failure effects of each member.
 */
export interface IAutoMovieArtifactStore {
  /**
   * The entry written under `key`, or `undefined` when there is none.
   * Missing entries resolve undefined; malformed keys, missing digest metadata and storage failures reject. The resolver propagates storage failures and only repairs entries it can read and hash.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes absent entries from malformed-key, metadata and storage rejection; the resolver verifies returned bytes before reuse.
   */
  read(key: string): Promise<IAutoMovieArtifactStore.IEntry | undefined>;

  /**
   * Replace the entry under `key` atomically, so a reader sees the old or the new entry, never a part.
   * Keep entry.bytes stable until the promise settles. The store owns any
   * retained copy; later caller mutation must not alter the stored generation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Requires atomic generation replacement and states byte-buffer stability through settlement and storage ownership afterward.
   */
  write(key: string, entry: IAutoMovieArtifactStore.IEntry): Promise<void>;

  /**
   * Delete the entry under `key`; removing an absent key succeeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives absent-key deletion success so corrupt-entry repair can remove a generation without racing an independent removal.
   */
  remove(key: string): Promise<void>;

  /**
   * The `sha256:` content digest of `bytes`, the same value every store computes.
   * Read bytes without mutation; the caller keeps them stable until settlement.
   * The result is lowercase hexadecimal after the prefix and hashes every byte.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes whole-buffer SHA-256, lowercase prefixed spelling and asynchronous byte stability so host adapters produce comparable content identities.
   */
  digest(bytes: Uint8Array): Promise<string>;
}

/**
 * Storage entry carried between the artifact resolver and host storage adapters.
 */
export namespace IAutoMovieArtifactStore {
  /**
   * One stored artifact generation. A successful read gives the caller its own mutable byte buffer; the recorded digest may disagree with corrupted bytes, which resolveAutoMovieArtifact detects before reuse.
   *
   * @evidence contracts/development/design.md#principled-representation An entry couples artifact bytes with the digest recorded at write time; resolveAutoMovieArtifact recomputes that digest before reuse and removes mismatches.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieArtifactStore owns the storage port and entry; the engine resolver uses the same entry with host-specific directory, HTTP or memory storage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The byte payload and recorded digest remain separate so corruption can be detected; neither a file path nor a transport handle enters the contract.
   * @evidence contracts/development/common.md#meaningful-documentation Storage entry carried between the artifact resolver and host storage adapters. An entry couples artifact bytes with the digest recorded at write time; resolveAutoMovieArtifact recomputes that digest before reuse and removes mismatches.
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
