/**
 * One staged project mutation: bytes to write, or an owned path to delete.
 *
 * @evidence contracts/common.md#principled-implementation Associates one absolute path with text/byte replacement or null deletion; commitFiles stages the population before revision and namespace guards apply it atomically.
 * @evidence contracts/common.md#clear-and-simple-design Publication and design operations compose entries while the transaction owner controls staging, guard order, rollback and revision publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Immutable requests exclusive creation and refuses every already-existing target, including matching bytes; reopening an existing generation is a separate caller decision. A path in this carrier is not independently admitted ownership.
 * @evidence contracts/common.md#meaningful-documentation Defines path, replacement/deletion and optional immutable behavior; caller-provided bytes remain an input to the transaction, not a successful publication receipt.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type chooses no staging traversal, hashing or commit algorithm; commitFiles and atomic helpers own them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A proposed mutation has no reuse verdict for a changed file or revision; publication guards decide currentness.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transaction owns the finite entry population and input buffers until commit/refusal; this record opens no file or task.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectStagedFile {
  /** Absolute owned path selected by the composing operation. */
  path: string;

  /** Text or byte replacement, or null to delete the path. */
  content: string | Uint8Array | null;

  /** Enforce immutable-generation publication when true. */
  immutable?: boolean;
}
