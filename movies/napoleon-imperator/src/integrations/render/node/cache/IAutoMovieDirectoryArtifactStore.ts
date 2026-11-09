import type { IAutoMovieArtifactStore } from "@automovie/engine";

/**
 * An engine artifact store kept in one local directory, as returned by
 * `createAutoMovieDirectoryArtifactStore`, with the listing and garbage
 * collection a run needs.
 *
 * @evidence contracts/development/design.md#principled-representation Extends the engine port with the stored-key set a planner diffs against and a collection step bounded by age and bytes, the two eviction limits Bazel's disk cache and Nuke's cache use; keys are the engine's `sha256:` strings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Render owns Node file storage; the viewer frame cache lists keys before planning and collects after a successful run, and productions reuse the same store for their own stages.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No stage or artifact kind is named; the engine port stays the read/write surface.
 * @evidence contracts/development/common.md#meaningful-documentation States what each added member reads or deletes, its units and the meaning of absent limits.
 */
export interface IAutoMovieDirectoryArtifactStore extends IAutoMovieArtifactStore {
  /** The directory this store owns. */
  directory: string;

  /**
   * Keys with a complete entry on disk now; content is verified only when read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Keys with a complete entry on disk now; content is verified only when read.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Keys with a complete entry on disk now; content is verified only when read.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  keys(): Promise<Set<string>>;

  /**
   * Delete entries outside `keep`, and abandoned partial writes.
   *
   * With neither limit, every entry outside `keep` is deleted, the per-run
   * manifest rule: what the finished run did not reference is garbage. With
   * `maxAgeMs`, only entries unread for longer are deleted; with `maxBytes`,
   * the least recently read entries outside `keep` are deleted until the
   * stored bytes fit. Kept entries are never deleted.
   *
   * @returns Number of deleted entries and the bytes that remain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Delete entries outside `keep`, and abandoned partial writes.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Delete entries outside `keep`, and abandoned partial writes.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  collect(options: {
    /** Keys the caller still references. */
    keep?: ReadonlySet<string>;

    /** Milliseconds since an entry was last written or read. */
    maxAgeMs?: number;

    /** Upper bound on the bytes of all remaining entries. */
    maxBytes?: number;
  }): Promise<{ removed: number; bytes: number }>;
}
