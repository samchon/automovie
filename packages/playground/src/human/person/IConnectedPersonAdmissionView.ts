import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * The admission report of the person on screen, with the identities that say
 * which evaluation it belongs to. The report is the owner's object as the
 * worker returned it, including any clearance and part readings.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows the displayed person's admission outcome and readings beside the model they describe.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Binds a report to the document and basis revisions of the evaluation that produced it.
 * @author Samchon
 */
export interface IConnectedPersonAdmissionView {
  /** Whether the displayed person is the accepted one or a refused construction. */
  mode: "accepted" | "construction draft";

  /** Identity of the evaluated person document. */
  document: string;

  /** Face basis revision the document names. */
  faceBasis: string;

  /** Body basis revision the document names. */
  bodyBasis: string;

  /** Material regions of the displayed model. */
  parts: number;

  /** The owner's unchanged report of that model. */
  admission: IAutoMovieHumanConstructionAdmission;
}
