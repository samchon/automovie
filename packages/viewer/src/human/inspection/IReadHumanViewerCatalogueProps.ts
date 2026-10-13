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
   */
  basisOf?: (file: string) => IHumanViewerBasisIdentity;

  /**
   * Source digests identifying displayed code and each numerical cache domain.
   */
  revisions: IHumanViewerRevisions;

  /**
   * Digest and identity of an input sidecar, or null while it is being read.
   */
  sidecar?: (name: string) => IHumanViewerSidecarFacts | null;

  /**
   * The published one-skin person generation the standard people are built on, or the named reason they cannot be; absent lists them as not published.
   */
  generation?: () =>
    | IHumanViewerPublishedGeneration
    | IHumanViewerRejectedInput;

  /**
   * The page owner's admission verdict for one input document; absent means none can be given yet.
   */
  admission?: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
}
