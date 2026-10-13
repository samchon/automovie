import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * The admission report of the person on screen, with the identities that say which evaluation it belongs to. The report is the owner's object as the worker returned it, including any clearance and part readings.
 *
 * Mode describes accepted history versus displayed construction draft. Material-region count is presentation coverage; the admission object's accepted flag and failures retain their owner's meanings rather than becoming a UI or clinical validity assertion.
 *
 * @evidence contracts/common.md#principled-implementation Document and paired basis ids bind the unchanged admission report to the exact displayed evaluation, separately from accepted-versus-construction display mode.
 * @evidence contracts/common.md#clear-and-simple-design One value projection supplies report display and saving without copying numerical validation logic or renderer internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused construction can remain displayed without entering accepted history, and material-region count does not establish complete anatomical coverage.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns report provenance, evaluation identity, display mode and interpretation of region count/owner acceptance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report value type implements no model checking or formatting algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Display labels and basis ids do not implement numerical cache equivalence or repeated evaluation reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The report projection retains ordinary owner data without acquiring a frame, worker or GPU resource.
 *
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
