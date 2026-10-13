import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead.js";
import type { IHumanViewerInputsIo } from "./IHumanViewerInputsIo.js";
import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";

/**
 * What the input reader needs: the files and the published identities and source digests their keys are built from.
 *
 * @evidence contracts/common.md#principled-implementation Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
 * @evidence contracts/common.md#clear-and-simple-design The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending sidecars and unavailable generation remain nullable, and requested input selection does not certify unrelated documents.
 * @evidence contracts/common.md#meaningful-documentation Documents exact-document selection, per-domain source authority, memo reuse and the page admission operation.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
 * @author Samchon
 */
export interface IReadHumanViewerInputsProps {
  /**
   * Exact document address; only its owning input file and entry are read.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Exact document address; only its owning input file and entry are read. Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Exact document address; only its owning input file and entry are read. The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
   */
  selectedDoc?: string;

  /**
   * Input directory access.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Input directory access. Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Input directory access. The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
   */
  io: IHumanViewerInputsIo;

  /**
   * Published face and body basis identities.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Published face and body basis identities. Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Published face and body basis identities. The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
   */
  bases: Record<"face" | "body", IHumanViewerBasisIdentity>;

  /**
   * The published one-skin person generation, or null while it is not valid.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The published one-skin person generation, or null while it is not valid. Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The published one-skin person generation, or null while it is not valid. The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
   */
  generation: IHumanViewerPublishedGeneration | null;

  /**
   * Digest of the source each domain's build reads.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Digest of the source each domain's build reads. Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Digest of the source each domain's build reads. The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
   */
  sources: Record<"face" | "body" | "person", string>;

  /**
   * Digest and identity of a sidecar file, or null while it is still being read.
   *
   * @evidence contracts/common.md#principled-implementation Selected-input sidecar lookup preserves actual identity/digest facts and pending null state.
   * @evidence contracts/common.md#clear-and-simple-design The IO host owns sidecar acquisition while the input reader owns document composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unread pending bytes cannot be replaced by the published generation's identity.
   * @evidence contracts/common.md#meaningful-documentation Defines the local sidecar name and nullable off-request fact result.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Selected-input sidecar lookup preserves actual identity/digest facts and pending null state.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The IO host owns sidecar acquisition while the input reader owns document composition.
   */
  sidecar: (name: string) => IHumanViewerSidecarFacts | null;

  /**
   * Per-file results kept between readings, keyed by file name.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Per-file results kept between readings, keyed by file name. Local document admission uses actual file access, basis/generation identities, source digests and independent page verdicts.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Per-file results kept between readings, keyed by file name. The host supplies IO, sidecar facts and memo storage while the reader owns selected-input keys and admission composition.
   */
  memo?: Map<string, IHumanViewerInputFileRead>;

  /**
   * The page owner's admission verdict for one input document at its key.
   *
   * @evidence contracts/common.md#principled-implementation Admission reports the owning page's verdict for one selected document at its cache key.
   * @evidence contracts/common.md#clear-and-simple-design The input reader borrows a verdict instead of implementing another numerical admission path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission for one selected entry does not certify unrelated input files.
   * @evidence contracts/common.md#meaningful-documentation Names the entry-specific page admission operation.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Admission reports the owning page's verdict for one selected document at its cache key.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The input reader borrows a verdict instead of implementing another numerical admission path.
   */
  admission: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
