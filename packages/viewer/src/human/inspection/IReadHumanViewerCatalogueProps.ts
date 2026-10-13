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
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host owns paths and reusable IO facts while the catalogue reader owns document composition.
 * @author Samchon
 */
export interface IReadHumanViewerCatalogueProps {
  /**
   * Application-owned reference and person example factories; no named preset is authored by this catalogue.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Application-owned reference and person example factories; no named preset is authored by this catalogue. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Application-owned reference and person example factories; no named preset is authored by this catalogue. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  exampleSources: IHumanViewerExampleSources;

  /**
   * Application-owned parameter sets; the viewer only binds them to admitted bases.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Application-owned parameter sets; the viewer only binds them to admitted bases. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Application-owned parameter sets; the viewer only binds them to admitted bases. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  bodyExamples: HumanViewerBodyExamples;

  /**
   * Exact document to read and admit; omission retains the complete catalogue.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Exact document to read and admit; omission retains the complete catalogue. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Exact document to read and admit; omission retains the complete catalogue. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  selectedDoc?: string;

  /**
   * The selected file has its own basis/packet/view sidecars, so published generation views are not its authority.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The selected file has its own basis/packet/view sidecars, so published generation views are not its authority. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The selected file has its own basis/packet/view sidecars, so published generation views are not its authority. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  independentInput?: boolean;

  /**
   * Published bases.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Published bases. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Published bases. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  basisFiles: IHumanViewerBasisFiles;

  /**
   * Published face subjects.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Published face subjects. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Published face subjects. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  documentsFile: string;

  /**
   * The generation's subject people file; absent or missing means the legacy subject people.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The generation's subject people file; absent or missing means the legacy subject people. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The generation's subject people file; absent or missing means the legacy subject people. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  subjectPeopleFile?: string;

  /**
   * Directory of hand-written documents and candidate bases, absent or empty when unused.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Directory of hand-written documents and candidate bases, absent or empty when unused. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Directory of hand-written documents and candidate bases, absent or empty when unused. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  inputsDirectory?: string;

  /**
   * Per-input-file results the caller keeps between readings, so an unchanged file is not read again.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Per-input-file results the caller keeps between readings, so an unchanged file is not read again. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Per-input-file results the caller keeps between readings, so an unchanged file is not read again. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  inputsMemo?: Map<string, IHumanViewerInputFileRead>;

  /**
   * The face documents the caller keeps between readings.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The face documents the caller keeps between readings. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The face documents the caller keeps between readings. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  faceMemo?: IHumanViewerFaceDocumentsMemo;

  /**
   * Identity and digest of a basis file; the server supplies a memoized reader so the tens of megabytes are hashed once.
   *
   * @evidence contracts/common.md#principled-implementation The optional reader returns identity and digest from the actual basis file.
   * @evidence contracts/common.md#clear-and-simple-design Host memoization avoids repeatedly hashing large unchanged basis bytes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A remembered identity is not substituted for a changed file's actual digest.
   * @evidence contracts/common.md#meaningful-documentation Defines the basis path input and memoized identity/digest result.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The optional reader returns identity and digest from the actual basis file.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Host memoization avoids repeatedly hashing large unchanged basis bytes.
   */
  basisOf?: (file: string) => IHumanViewerBasisIdentity;

  /**
   * Source digests identifying displayed code and each numerical cache domain.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source digests identifying displayed code and each numerical cache domain. Catalogue inputs pair published identities and dependency revisions with explicit memoized sidecar and admission readers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source digests identifying displayed code and each numerical cache domain. The host owns paths and reusable IO facts while the catalogue reader owns document composition.
   */
  revisions: IHumanViewerRevisions;

  /**
   * Digest and identity of an input sidecar, or null while it is being read.
   *
   * @evidence contracts/common.md#principled-implementation Sidecar lookup returns the actual decoded identity and digest or null while reading is pending.
   * @evidence contracts/common.md#clear-and-simple-design The host retains sidecar IO and memoization outside catalogue composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending null fact is not promoted to a valid basis or packet.
   * @evidence contracts/common.md#meaningful-documentation Documents the sidecar name and its pending nullable result.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Sidecar lookup returns the actual decoded identity and digest or null while reading is pending.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host retains sidecar IO and memoization outside catalogue composition.
   */
  sidecar?: (name: string) => IHumanViewerSidecarFacts | null;

  /**
   * The published one-skin person generation the standard people are built on, or the named reason they cannot be; absent lists them as not published.
   *
   * @evidence contracts/common.md#principled-implementation Generation lookup returns the usable paired publication or the named rejection for that pair.
   * @evidence contracts/common.md#clear-and-simple-design The generation reader owns paired-view admission; catalogue composition borrows its verdict.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected or missing views do not silently fall back to unrelated face and body bases.
   * @evidence contracts/common.md#meaningful-documentation Defines the successful generation and explicit rejected-input alternatives.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Generation lookup returns the usable paired publication or the named rejection for that pair.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The generation reader owns paired-view admission; catalogue composition borrows its verdict.
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
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Admission reads the page owner's verdict for the supplied catalogue entry.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The catalogue borrows current page admission without repeating numerical evaluation.
   */
  admission?: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
