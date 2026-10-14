import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSourceRevisions } from "./IHumanViewerSourceRevisions.js";

/**
 * The source owner as watching uses it: what to watch and how an edit maps to a revision.
 *
 * @evidence contracts/common.md#principled-implementation Watched source authority separates handwritten inputs, source dependencies, basis files, generation views and application examples because each edit has different invalidation effects.
 * @evidence contracts/common.md#clear-and-simple-design Paths and revision operations share one source owner; the watcher orchestrates notifications without owning numerical source hashing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Application examples remain external inputs, while real source and checked-loader edits refresh dependency authority rather than bypassing admission.
 * @evidence contracts/common.md#meaningful-documentation Members explain each watched input, optional subject-people source, path normalization, basis refresh and revision ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The watched-source shape selects no event coalescing or filesystem subscription algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work The revision owner decides graph-equivalent work; published basis refresh and input rescans remain distinct effects of watched changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Paths and borrowed callbacks own no watcher handle; subscribeHumanViewerSources and its caller manage subscriptions and pending batches.
 *
 * @author Samchon
 */
export interface IHumanViewerWatchedSource {
  /** Directory of hand-written inputs; an edit there rereads the catalogue. */
  inputsDirectory: string;

  /** Source directories whose reached files move revisions. */
  watched: readonly string[];

  /** Published bases; an edit refreshes their digests. */
  basisFiles: IHumanViewerBasisFiles;

  /** Published person generation views; an edit rereads the catalogue. */
  generationFiles: IHumanViewerGenerationFiles;

  /** Published face subjects. */
  documentsFile: string;

  /** The generation's subject people, if any; edits reread the catalogue and also invalidate revision authority when reached by checked inputs. */
  subjectPeopleFile?: string;

  /** Playground body examples; edits reread the catalogue and also invalidate revision authority when reached by checked inputs. */
  bodyExamplesFile: string;

  /**
   * Normalize a path to forward slashes for revision identity and reach checks.
   *
   * @evidence contracts/common.md#principled-implementation Path normalization gives revision identity and reach comparisons the same slash representation on Windows and POSIX.
   * @evidence contracts/common.md#clear-and-simple-design The watcher borrows the source owner's normalization rather than maintaining a second path convention.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalization changes separators only and does not rewrite selected source paths to manufactured identities.
   * @evidence contracts/common.md#meaningful-documentation The member identifies forward slashes as the comparison representation used for revision identity and reach.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This conversion signature does not choose a string-replacement implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stateless path conversion introduces no retained memo or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Normalized strings acquire no watcher subscription or filesystem handle.
   */
  slash: (file: string) => string;

  /**
   * Ask the source owner's basis memo for identities and digests before computing changed source authority. Current mtime/size stamp equality can reuse old facts after a byte rewrite preserving both values.
   *
   * @evidence contracts/common.md#principled-implementation Basis metadata is requested before revision computation; the actual memo refreshes on a changed provider stamp, whose mtime/size equality does not independently prove unchanged bytes.
   * @evidence contracts/common.md#clear-and-simple-design Basis-file reading stays with the source owner while watching triggers its refresh.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refresh follows the actual basis memo authority rather than fabricating a new digest; same-size same-mtime rewrites can remain indistinguishable and are not claimed freshly hashed.
   * @evidence contracts/common.md#meaningful-documentation The member documents identity/digest refresh and its order before changed-source publication.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refresh capability declares no basis-byte reading or SHA-256 implementation strategy.
   * @evidence contracts/performance.md#reuse-equivalent-work The basis memo replaces facts when its provider stamp changes and shares equal-stamp facts with catalogue reads; current mtime/size stamps can collide after a byte rewrite.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The watcher borrows refresh authority; basis buffer and memo lifetimes remain with the source owner.
   */
  refreshBases: () => void;

  /** The revision owner. */
  revisions: IHumanViewerSourceRevisions;
}
