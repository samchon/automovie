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
 * @evidence contracts/common.md#principled-implementation Handwritten-input reading receives filesystem access, published identities, sidecar facts, source digests and owner admission as separate authorities.
 * @evidence contracts/common.md#clear-and-simple-design Exact-document selection and a per-file memo bound reading responsibility to input discovery, leaving numerical validation with the page's owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending sidecars remain null and unadmitted descriptors cannot be treated as drawable merely because their ids are known.
 * @evidence contracts/common.md#meaningful-documentation Comments explain selected-file filtering, nullable generation, sidecar pending state and admission at the document cache key.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input-props type chooses no filename scan, JSON parsing or sidecar hashing strategy.
 * @evidence contracts/performance.md#reuse-equivalent-work The optional memo reuses per-file results only under unchanged file stamp, sidecars, bases, generation and source authority; admission is reapplied.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the optional filename-keyed memo without a declared entry cap; input props themselves acquire no filesystem or GPU handles.
 *
 * @author Samchon
 */
export interface IReadHumanViewerInputsProps {
  /** Exact document address; only its owning input file is projected, and only the matching entry reaches admission. The file is parsed in full and projected until refusal, so other array members can still be inspected. */
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
   * @evidence contracts/common.md#principled-implementation The input reader sees null until sidecar digest and identities are known, preserving pending authority during asynchronous reading.
   * @evidence contracts/common.md#clear-and-simple-design Handwritten-input parsing depends on small file facts while the sidecar owner handles large compressed content.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A not-yet-read candidate cannot acquire a guessed basis identity or be drawn against a fallback file.
   * @evidence contracts/common.md#meaningful-documentation The member states that an unfinished sidecar read returns null instead of completed facts.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input-sidecar query defines no scanning or decompression algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Per-input signatures include the returned sidecar facts, while the provider reuses each result only at its current file stamp.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input parser borrows metadata and owns neither background file tasks nor inflated sidecar arrays.
   */
  sidecar: (name: string) => IHumanViewerSidecarFacts | null;

  /** Per-file results kept between readings, keyed by file name. */
  memo?: Map<string, IHumanViewerInputFileRead>;

  /**
   * The page owner's admission verdict for one input document at its key.
   *
   * @evidence contracts/common.md#principled-implementation Handwritten documents become drawable only when the numerical page owner admitted that exact entry key.
   * @evidence contracts/common.md#clear-and-simple-design File discovery asks for owner decisions without implementing another numerical schema validator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unchanged file parsing does not bypass a pending or refused owner verdict on a later catalogue read.
   * @evidence contracts/common.md#meaningful-documentation The comment ties the admission result to one input document and its authority key.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This admission signature selects no construction algorithm or worker-queue implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work Cached per-file entries still pass admission on each read; the admission owner decides equivalence from document/basis/source authority.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input reader borrows verdict state and never takes ownership of the admission worker or its queued tasks.
   */
  admission: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
