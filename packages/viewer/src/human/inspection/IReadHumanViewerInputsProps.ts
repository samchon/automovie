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
 * @author Samchon
 */
export interface IReadHumanViewerInputsProps {
  /** Exact document address; only its owning input file and entry are read. */
  selectedDoc?: string;

  /** Input directory access. */
  io: IHumanViewerInputsIo;

  /** Published face and body basis identities. */
  bases: Record<"face" | "body", IHumanViewerBasisIdentity>;

  /**
   * The published one-skin person generation, or null while it is not valid.
   */
  generation: IHumanViewerPublishedGeneration | null;

  /** Digest of the source each domain's build reads. */
  sources: Record<"face" | "body" | "person", string>;

  /**
   * Digest and identity of a sidecar file, or null while it is still being read.
   *
   * @evidence contracts/common.md#principled-implementation Selected-input sidecar lookup preserves actual identity/digest facts and pending null state.
   * @evidence contracts/common.md#clear-and-simple-design The IO host owns sidecar acquisition while the input reader owns document composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unread pending bytes cannot be replaced by the published generation's identity.
   * @evidence contracts/common.md#meaningful-documentation Defines the local sidecar name and nullable off-request fact result.
   */
  sidecar: (name: string) => IHumanViewerSidecarFacts | null;

  /** Per-file results kept between readings, keyed by file name. */
  memo?: Map<string, IHumanViewerInputFileRead>;

  /**
   * The page owner's admission verdict for one input document at its key.
   *
   * @evidence contracts/common.md#principled-implementation Admission reports the owning page's verdict for one selected document at its cache key.
   * @evidence contracts/common.md#clear-and-simple-design The input reader borrows a verdict instead of implementing another numerical admission path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission for one selected entry does not certify unrelated input files.
   * @evidence contracts/common.md#meaningful-documentation Names the entry-specific page admission operation.
   */
  admission: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
