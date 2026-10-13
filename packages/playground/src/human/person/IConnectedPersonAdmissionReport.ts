import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * The mounted admission report: the panel hands it the report of whatever is on screen after every state change.
 *
 * The report remains the numerical owner's unchanged admission object. A construction draft is shown with its refused qualification and can be saved with evaluation identity; rendering this report neither evaluates nor promotes the model.
 *
 * @evidence contracts/common.md#principled-implementation The displayed view carries the exact model owner's report and accepted/draft mode so presentation retains numerical qualification rather than creating a second verdict.
 * @evidence contracts/common.md#clear-and-simple-design One show method updates the current report mount while the panel supplies display identity and the numerical owner supplies checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rendering or saving a refused construction report does not promote it into accepted history or clinical geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies unchanged report provenance, accepted/draft qualification, saving identity and presentation-only responsibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report handle type chooses no serialization, numerical check or DOM algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type carries current display reports without a numerical admission cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mount implementation owns DOM and one shown-view reference; the interface acquires no model or renderer handle.
 *
 * @author Samchon
 */
export interface IConnectedPersonAdmissionReport {
  /**
   * Draw this displayed view's unchanged admission and mode; null disables report saving and names absence of a displayed person.
   *
   * @evidence contracts/common.md#principled-implementation A supplied view is presented directly and null distinguishes no display rather than a fabricated successful report.
   * @evidence contracts/common.md#clear-and-simple-design The panel decides which person is displayed and this method updates only its report presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An owner refusal is not summarized into acceptance and null receives no guessed admission result.
   * @evidence contracts/common.md#meaningful-documentation The member identifies unchanged report/mode, null absence and disabled saving.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature chooses no report formatting or DOM update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Report publication is a presentation effect with no shared numerical evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The report mount owns the retained shown view and event listener behind this method.
   */
  show(view: IConnectedPersonAdmissionView | null): void;
}
