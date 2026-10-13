import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IReadHumanViewerStandardPeopleProps } from "./IReadHumanViewerStandardPeopleProps.js";
import type { IReadHumanViewerSubjectPeopleProps } from "./IReadHumanViewerSubjectPeopleProps.js";

/**
 * Application-owned example inputs and document factories. The inspection
 * service supplies current basis and source authority, while the application
 * chooses every named example and its parameters; the library owns neither.
 *
 * @author Samchon
 */
export interface IHumanViewerExampleSources {
  /** Application-authored face document array. */
  documentsFile: string;

  /**
   * Application-authored people on the published generation; absent means
   * the subject people derived from the face documents.
   */
  subjectPeopleFile?: string;

  /** Application-authored body parameter sets. */
  bodyExamplesFile: string;

  /**
   * Application-authored observation camera poses, read only as display metadata.
   */
  cameraPosesFile: string;

  /**
   * Create the application's reference document on the supplied actual face basis.
   */
  reference: (face: IHumanViewerBasisIdentity) => IHumanViewerReferenceFaceDocument;

  /**
   * Create the application's standard person examples with the supplied published generation.
   */
  standardPeople: (props: IReadHumanViewerStandardPeopleProps) => IHumanViewerCatalogueEntry[];

  /**
   * Create the application's subject examples with the supplied legacy paired bases.
   */
  subjectPeople: (props: IReadHumanViewerSubjectPeopleProps) => IHumanViewerCatalogueEntry[];
}
