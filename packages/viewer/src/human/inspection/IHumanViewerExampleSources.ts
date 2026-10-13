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
 * @evidence contracts/common.md#principled-implementation Explicit application paths and document factories preserve example ownership separately from viewer basis, key and admission authority.
 * @evidence contracts/common.md#clear-and-simple-design One binding record carries the existing example readers and constructors needed by the catalogue without a second implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named reference values and neutral person presets are supplied by the application rather than encoded in generic library source.
 * @evidence contracts/common.md#meaningful-documentation Defines file inputs and exact factory responsibilities while retaining numerical admission with the domain owners.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Supplies application-owned face selection and presets to the inspection catalogue without allowing the library to author a named reference.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Separates application example documents and display camera records from generic viewing, keying and numerical admission.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies application-owned body states and paired-person examples for the same browser inspection path.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps body example selection with the application while the viewer receives actual basis and document authority.
 * @author Samchon
 */
export interface IHumanViewerExampleSources {
  /**
   * Application-authored face document array.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Names the application-authored independent face document input.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Supplies document parameters separately from the published basis used for replay.
   */
  documentsFile: string;

  /**
   * Application-authored people on the published generation.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Names application people offered by the catalogue's selection control.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Supplies selected person documents while generation and display admission remain outside the file path.
   */
  subjectPeopleFile: string;

  /**
   * Application-authored body parameter sets.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names the body-state presets authored by the application.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Supplies body example states without defining geometry or body-channel ranges in the viewer.
   */
  bodyExamplesFile: string;

  /**
   * Application-authored observation camera poses, read only as display metadata.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Supplies application camera observations for the viewer's inspection controls.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps observation camera metadata outside numerical authoring documents.
   */
  cameraPosesFile: string;

  /**
   * Create the application's reference document on the supplied actual face basis.
   *
   * @evidence contracts/common.md#principled-implementation The application receives the actual published face identity before creating its named reference parameter document.
   * @evidence contracts/common.md#clear-and-simple-design One callback transfers reference-example ownership without another geometry or document evaluator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No neutral preset values or subject lookup constants are supplied by this library callback contract.
   * @evidence contracts/common.md#meaningful-documentation Defines the supplied face basis and returned application-authored reference document.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Binds the application's reference parameters to the supplied face basis identity.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Keeps document parameters separate from the reusable connected basis they name.
   */
  reference: (face: IHumanViewerBasisIdentity) => IHumanViewerReferenceFaceDocument;

  /**
   * Create the application's standard person examples with the supplied published generation.
   *
   * @evidence contracts/common.md#principled-implementation Supplied publication and dependency authority bind the application's composed face/body example documents.
   * @evidence contracts/common.md#clear-and-simple-design One existing example constructor is injected without a library-owned preset implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This contract adds no named neutral body, population choice or fitted subject geometry.
   * @evidence contracts/common.md#meaningful-documentation States standard-person example responsibility and the published-generation inputs.
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies application person examples that pair the selected body state with its reference face.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Composes example documents for the shared body/person inspection catalogue without defining numerical construction.
   */
  standardPeople: (props: IReadHumanViewerStandardPeopleProps) => IHumanViewerCatalogueEntry[];

  /**
   * Create the application's subject examples with the supplied legacy paired bases.
   *
   * @evidence contracts/common.md#principled-implementation Supplied subject documents and legacy basis identities remain the authority of the application's paired examples.
   * @evidence contracts/common.md#clear-and-simple-design One constructor callback preserves the legacy example consumer without a second library factory.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The binding neither hardcodes a subject nor converts its unsupported channels into another basis representation.
   * @evidence contracts/common.md#meaningful-documentation Defines legacy paired-basis example responsibility and the original subject inputs.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Preserves each supplied subject's declared face basis in the application's paired example.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Keeps original parameter documents on the basis representation that defines their channels.
   */
  subjectPeople: (props: IReadHumanViewerSubjectPeopleProps) => IHumanViewerCatalogueEntry[];
}
