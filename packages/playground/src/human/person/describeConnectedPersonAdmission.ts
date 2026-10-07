import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * Bind the displayed person's admission report to the identities of its
 * evaluation, for the admission report panel and its saved file. The report
 * object is passed through as received. Nothing displayed, or a displayed
 * person whose report is unknown, has no view.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names which document and basis revisions the displayed admission report belongs to.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Derives the report view from the displayed person without altering the report.
 * @author Samchon
 */
export function describeConnectedPersonAdmission(
  mode: IConnectedPersonAdmissionView["mode"],
  document: IAutoMovieHumanPersonDocument | undefined,
  parts: number | undefined,
  admission: IAutoMovieHumanConstructionAdmission | undefined,
): IConnectedPersonAdmissionView | null {
  if (document === undefined || parts === undefined || admission === undefined)
    return null;
  return {
    mode,
    document: document.id,
    faceBasis: document.face.basis,
    bodyBasis: document.body.basis,
    parts,
    admission,
  };
}
