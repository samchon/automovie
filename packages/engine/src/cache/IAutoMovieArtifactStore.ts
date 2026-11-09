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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: The entry written under `key`, or `undefined` when there is none.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: The entry written under `key`, or `undefined` when there is none.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  read(key: string): Promise<IAutoMovieArtifactStore.IEntry | undefined>;

  /**
   * Replace the entry under `key` atomically, so a reader sees the old or the new entry, never a part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Replace the entry under `key` atomically, so a reader sees the old or the new entry, never a part.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Replace the entry under `key` atomically, so a reader sees the old or the new entry, never a part.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  write(key: string, entry: IAutoMovieArtifactStore.IEntry): Promise<void>;

  /**
   * Delete the entry under `key`; removing an absent key succeeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Delete the entry under `key`; removing an absent key succeeds.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Delete the entry under `key`; removing an absent key succeeds.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  remove(key: string): Promise<void>;

  /**
   * The `sha256:` content digest of `bytes`, the same value every store computes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: The `sha256:` content digest of `bytes`, the same value every store computes.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: The `sha256:` content digest of `bytes`, the same value every store computes.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  digest(bytes: Uint8Array): Promise<string>;
}
export namespace IAutoMovieArtifactStore {
  /**
   * One stored artifact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One stored artifact.
   * @evidence contracts/development/design.md#principled-representation Represents One stored artifact: interface of 2 members (`bytes`, `digest`); units and frames named in its text: bytes, sha256. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IEntry` in packages/engine/src/cache/IAutoMovieArtifactStore.ts; its surface is the 2 members listed and the text shows 31 other files naming it, mostly packages/engine (12), movies (10), test (5), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IEntry {
    /** The artifact's bytes, owned by the reader after `read`. */
    bytes: Uint8Array;

    /** `sha256:` content digest of `bytes`, recorded when the entry was written. */
    digest: string;
  }
}
