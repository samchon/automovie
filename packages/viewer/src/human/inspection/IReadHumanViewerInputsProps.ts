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
   */
  sidecar: (name: string) => IHumanViewerSidecarFacts | null;

  /** Per-file results kept between readings, keyed by file name. */
  memo?: Map<string, IHumanViewerInputFileRead>;

  /** The page owner's admission verdict for one input document at its key. */
  admission: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
