import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";

/**
 * The inputs and digests a catalogue is read from.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies paths, memoized digests and sidecar facts; the reader owns composition.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface IReadHumanViewerCatalogueProps {
  /** Published bases. */
  basisFiles: IHumanViewerBasisFiles;

  /** Published face subjects. */
  documentsFile: string;

  /** Directory of hand-written documents and candidate bases, absent or empty when unused. */
  inputsDirectory?: string;

  /** Identity and digest of a basis file; the server supplies a memoized reader so the tens of megabytes are hashed once. */
  basisOf?: (file: string) => IHumanViewerBasisIdentity;

  /** The digests the page reloads on and each domain's builds depend on. */
  revisions: IHumanViewerRevisions;

  /** Digest and identity of an input sidecar, or null while it is being read. */
  sidecar?: (name: string) => IHumanViewerSidecarFacts | null;

  /** The page owner's admission verdict for one input document; absent means none can be given yet. */
  admission?: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
