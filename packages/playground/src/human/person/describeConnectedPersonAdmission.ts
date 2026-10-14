import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * Bind the displayed person's admission report to the identities of its
 * evaluation, for the admission report panel and its saved file. The report
 * object is passed through as received. Nothing displayed, or a displayed
 * person whose report is unknown, has no view.
 * Mode and report agreement are the current panel's authority; this formatter does not independently prove that the supplied mode, basis ids or report belong to one evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Current display identity, both basis ids, material count and original owner admission object form one view, while missing document/count/report yields no fabricated report.
 * @evidence contracts/common.md#clear-and-simple-design The formatter binds presentation identities without repeating numerical admission or rewriting the original report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown reports remain absent and caller-supplied mode/identity are not treated as independently verified evaluation provenance.
 * @evidence contracts/common.md#meaningful-documentation The comment states original report pass-through, missing-input null and the actual panel provenance premise.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-field construction is constant work and borrows the admission object; no failure, clearance or geometry traversal occurs in this formatter.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each current display view needs its own identity wrapper; cheap fixed metadata is not retained as a numerical cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains no view after return and acquires no resource; the report and its diagnostic arrays remain borrowed while the panel/report surface retains the view.
 *
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
