import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead";
import type { IHumanViewerInputsIo } from "./IHumanViewerInputsIo";
import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";

/**
 * What the input reader needs: the files and the published identities and
 * source digests their keys are built from.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies bytes and digests; the reader owns admission and keys.
 * @evidence contracts/common.md#meaningful-documentation Names every input of the reader.
 * @author Samchon
 */
export interface IReadHumanViewerInputsProps {
  /** Input directory access. */
  io: IHumanViewerInputsIo;

  /** Published face and body basis identities. */
  bases: Record<"face" | "body", IHumanViewerBasisIdentity>;

  /** The published one-skin person generation, or null while it is not valid. */
  generation: IHumanViewerPublishedGeneration | null;

  /** Digest of the source each domain's build reads. */
  sources: Record<"face" | "body" | "person", string>;

  /** Digest and identity of a sidecar file, or null while it is still being read. */
  sidecar: (name: string) => IHumanViewerSidecarFacts | null;

  /** Per-file results kept between readings, keyed by file name. */
  memo?: Map<string, IHumanViewerInputFileRead>;

  /** The page owner's admission verdict for one input document at its key. */
  admission: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
