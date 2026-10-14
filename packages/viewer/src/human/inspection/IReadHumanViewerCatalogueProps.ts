import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";
import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerExampleSources } from "./IHumanViewerExampleSources.js";
import type { IHumanViewerFaceDocumentsMemo } from "./IHumanViewerFaceDocumentsMemo.js";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead.js";
import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";

/**
 * The inputs and digests a catalogue is read from.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue inputs combine application examples, published/candidate basis authority, domain source revisions and page-owner admission so descriptors cannot independently become drawables.
 * @evidence contracts/common.md#clear-and-simple-design Optional readers and memos keep expensive file facts with their owners while catalogue composition chooses which supported input documents to expose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named example parameters remain application-owned; selected inputs still pass owner admission and do not select fixture-specific numerical behavior.
 * @evidence contracts/common.md#meaningful-documentation Comments define optional selection, independent sidecars, memo ownership, asynchronous sidecar absence and missing-generation/admission outcomes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The catalogue-props declaration selects no parsing or hashing algorithm; readHumanViewerCatalogue owns composition costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Per-file and face memos reuse equal provider stamps and source/basis authority; current mtime/size stamps can miss preserving byte rewrites, while page admission is queried independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed memos retain one entry per encountered input file and a face-document slot; no cap is declared here, and the controller owns replacement and release.
 *
 * @author Samchon
 */
export interface IReadHumanViewerCatalogueProps {
  /**
   * Application-owned reference and person example factories; no named preset is authored by this catalogue.
   */
  exampleSources: IHumanViewerExampleSources;

  /**
   * Application-owned parameter sets; the viewer only binds them to admitted bases.
   */
  bodyExamples: HumanViewerBodyExamples;

  /**
   * Document whose owner admission is selected; omission retains the complete catalogue. Its owning JSON file is still parsed in full, and array projection can inspect other members before selecting the matching entry or stopping on a refusal.
   */
  selectedDoc?: string;

  /**
   * The selected file has its own basis/packet/view sidecars, so published generation views are not its authority.
   */
  independentInput?: boolean;

  /** Published bases. */
  basisFiles: IHumanViewerBasisFiles;

  /** Published face subjects. */
  documentsFile: string;

  /**
   * The generation's subject people file; absent or missing means the legacy subject people.
   */
  subjectPeopleFile?: string;

  /**
   * Directory of hand-written documents and candidate bases, absent or empty when unused.
   */
  inputsDirectory?: string;

  /**
   * Per-input-file results reused under equal provider stamp and dependency authority. Current mtime/size stamp equality does not prove unchanged bytes.
   */
  inputsMemo?: Map<string, IHumanViewerInputFileRead>;

  /** The face documents the caller keeps between readings. */
  faceMemo?: IHumanViewerFaceDocumentsMemo;

  /**
   * Identity and digest of a basis file; the server supplies a memoized reader so equal provider stamps reuse its prior byte facts.
   *
   * @evidence contracts/common.md#principled-implementation The basis reader returns both opening identity and compressed-byte digest from the selected published basis file.
   * @evidence contracts/common.md#clear-and-simple-design Borrowing the source owner's reader prevents catalogue composition from owning a second large-file cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned identity is read from basis bytes rather than inferred from a filename or selected example id.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies identity/digest output and the server-owned memoization of expensive basis hashing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The optional reader signature selects no compressed-file parsing or hash algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work The server's basis memo reuses equal-stamp facts and refreshes after a changed stamp; same-size same-mtime byte rewrites can retain old authority.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This borrowed callback owns no read handle or basis buffer; the source memo owner manages retained metadata.
   */
  basisOf?: (file: string) => IHumanViewerBasisIdentity;

  /**
   * Source digests identifying displayed code and each numerical cache domain.
   */
  revisions: IHumanViewerRevisions;

  /**
   * Digest and identity of an input sidecar, or null while it is being read.
   *
   * @evidence contracts/common.md#principled-implementation Sidecar facts preserve asynchronous file-reading state as null instead of blocking catalogue publication for decompression.
   * @evidence contracts/common.md#clear-and-simple-design The catalogue asks for metadata while the background sidecar owner handles byte reading, hashing and identity scanning.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending facts are not guessed from the sidecar filename or fabricated as an admitted basis.
   * @evidence contracts/common.md#meaningful-documentation The member documents digest/identity delivery and null during the outstanding read.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The optional metadata callback chooses no inflation or streaming strategy.
   * @evidence contracts/performance.md#reuse-equivalent-work Sidecar results are keyed by filename and provider stamp; changed stamps start new reads and publication refuses a differing current stamp. Same-stamp rewrites or A-to-B-to-A recurrence are not distinguished by request generation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Catalogue composition borrows sidecar facts without owning compressed buffers or in-flight read tasks.
   */
  sidecar?: (name: string) => IHumanViewerSidecarFacts | null;

  /**
   * The published one-skin person generation the standard people are built on, or the named reason they cannot be; absent lists them as not published.
   *
   * @evidence contracts/common.md#principled-implementation The generation reader verifies an explicit head/body view pair and returns either their usable identities/digests or a reasoned rejection.
   * @evidence contracts/common.md#clear-and-simple-design Pair validation stays behind one callback rather than being repeated while constructing each standard example.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing generation is not silently replaced by unrelated legacy face/body bases for standard people.
   * @evidence contracts/common.md#meaningful-documentation The comment explains the usable-generation result, named failure and omitted-provider not-published behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type selects no packet scanner or generation-comparison implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work The generation provider uses current stamped view facts; common generation ids alone do not replace head/body byte digests in keys.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This callback lends generation metadata and transfers no numerical worker, file stream or view-buffer ownership.
   */
  generation?: () =>
    | IHumanViewerPublishedGeneration
    | IHumanViewerRejectedInput;

  /**
   * The page owner's admission verdict for one input document; absent means none can be given yet.
   *
   * @evidence contracts/common.md#principled-implementation Admission is queried from the page's actual numerical owner at the document's authority key before publication as drawable.
   * @evidence contracts/common.md#clear-and-simple-design The catalogue consumes a verdict and does not duplicate face/body/person validation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing admission remains pending rather than accepting viewer-authored examples or known ids automatically.
   * @evidence contracts/common.md#meaningful-documentation The member documents owner verdict delivery and omission while no page can give a verdict.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This verdict-query signature does not choose numerical construction or admission scheduling algorithms.
   * @evidence contracts/performance.md#reuse-equivalent-work Admission reuse depends on the entry's document, basis and numerical-source key; changed authority requires a new owner verdict.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Querying a verdict borrows admission state; the admission owner retains and settles its numerical tasks.
   */
  admission?: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
