import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerFaceDocumentsMemo } from "./IHumanViewerFaceDocumentsMemo.js";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead.js";
import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";
import type { IHumanViewerExampleSources } from "./IHumanViewerExampleSources.js";

/**
 * The inputs and digests a catalogue is read from.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
 * @evidence contracts/common.md#clear-and-simple-design The host owns paths and reusable IO facts while the catalogue reader owns document composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selected independent input authority remains distinct from published generation authority, with pending facts retained explicitly.
 * @evidence contracts/common.md#meaningful-documentation Documents selected-document boundaries, optional memo/readers, published generation refusal and current page admission.
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
   * Exact document to read and admit; omission retains the complete catalogue.
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
   * Per-input-file results the caller keeps between readings, so an unchanged file is not read again.
   */
  inputsMemo?: Map<string, IHumanViewerInputFileRead>;

  /** The face documents the caller keeps between readings. */
  faceMemo?: IHumanViewerFaceDocumentsMemo;

  /**
   * Identity and digest of a basis file; the server supplies a memoized reader so the tens of megabytes are hashed once.
   *
   * @evidence contracts/common.md#principled-implementation The optional reader returns identity and digest from the actual basis file.
   * @evidence contracts/common.md#clear-and-simple-design Host memoization avoids repeatedly hashing large unchanged basis bytes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A remembered identity is not substituted for a changed file's actual digest.
   * @evidence contracts/common.md#meaningful-documentation Defines the basis path input and memoized identity/digest result.
   */
  basisOf?: (file: string) => IHumanViewerBasisIdentity;

  /**
   * Source digests identifying displayed code and each numerical cache domain.
   */
  revisions: IHumanViewerRevisions;

  /**
   * Digest and identity of an input sidecar, or null while it is being read.
   *
   * @evidence contracts/common.md#principled-implementation Sidecar lookup returns the actual decoded identity and digest or null while reading is pending.
   * @evidence contracts/common.md#clear-and-simple-design The host retains sidecar IO and memoization outside catalogue composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending null fact is not promoted to a valid basis or packet.
   * @evidence contracts/common.md#meaningful-documentation Documents the sidecar name and its pending nullable result.
   */
  sidecar?: (name: string) => IHumanViewerSidecarFacts | null;

  /**
   * The published one-skin person generation the standard people are built on, or the named reason they cannot be; absent lists them as not published.
   *
   * @evidence contracts/common.md#principled-implementation Generation lookup returns the usable paired publication or the named rejection for that pair.
   * @evidence contracts/common.md#clear-and-simple-design The generation reader owns paired-view admission; catalogue composition borrows its verdict.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected or missing views do not silently fall back to unrelated face and body bases.
   * @evidence contracts/common.md#meaningful-documentation Defines the successful generation and explicit rejected-input alternatives.
   */
  generation?: () =>
    | IHumanViewerPublishedGeneration
    | IHumanViewerRejectedInput;

  /**
   * The page owner's admission verdict for one input document; absent means none can be given yet.
   *
   * @evidence contracts/common.md#principled-implementation Admission reads the page owner's verdict for the supplied catalogue entry.
   * @evidence contracts/common.md#clear-and-simple-design The catalogue borrows current page admission without repeating numerical evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent reader does not certify documents from a successful HTTP or draw result.
   * @evidence contracts/common.md#meaningful-documentation States the entry-bound page verdict and optional unavailable-reader state.
   */
  admission?: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
