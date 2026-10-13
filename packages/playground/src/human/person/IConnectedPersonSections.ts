import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The mounted control sections of the person editor, as the panel drives them after a state change. Render redraws the body joint/anatomy and face channel controls from working state. Refresh repaints the remaining forms and schedules numerical reads; it returns before those asynchronous reads finish, whose owners guard latest results and draft availability.
 *
 * @evidence contracts/common.md#principled-implementation Working-state rendering and displayed-person form/measurement refresh are distinct operations under the panel's shared person transaction.
 * @evidence contracts/common.md#clear-and-simple-design This mounted-section view coordinates existing child controls while each child owns its fields and read results, and the panel owns admission/history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Void refresh is not represented as completed numerical readback, and draft measurements remain refused through the actual section assembly gate.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the two repaint responsibilities, asynchronous refresh completion limits and child latest-result authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface chooses no DOM redraw, measurement or child traversal algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mounted section operations declare no cached numerical equivalence or shared geometry result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Child DOM/listeners and numerical requests remain mounted panel and transport resources rather than allocations of this interface.
 *
 * @author Samchon
 */
export interface IConnectedPersonSections {
  /**
   * Redraw body channel/joint/anatomy and face channel controls from the latest working document.
   *
   * @evidence contracts/common.md#principled-implementation Repainting working-state controls preserves the panel's one draft source rather than giving sections separate committed documents.
   * @evidence contracts/common.md#clear-and-simple-design The section coordinator delegates actual rendering to existing body and face owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Control repaint does not declare a pending draft admitted or evaluate new geometry itself.
   * @evidence contracts/common.md#meaningful-documentation The member names rendered sections and their working-document source.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The method type chooses no DOM grouping or child-render traversal implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repainting authored state is an effect rather than numerical cache reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Child controls and their DOM lifetime remain owned by the mounted panel.
   */
  render(): void;

  /**
   * Refill child forms for a newly displayed person and schedule registered measurements; this void return does not await their numerical settlement.
   *
   * @evidence contracts/common.md#principled-implementation Displayed-person state refreshes body/face forms and starts child-owned readings whose latest generation and draft guards control presentation.
   * @evidence contracts/common.md#clear-and-simple-design The coordinator triggers refresh while each form/measurement owner handles its own fields and asynchronous result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Calling refresh alone does not certify measurements completed, and construction drafts receive no admitted-person readback.
   * @evidence contracts/common.md#meaningful-documentation The member specifies displayed input, scheduled measurements and the non-awaiting return boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This method type selects no child refresh or numerical reading algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refresh declares no reusable reading equivalence across displayed documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending reads remain child/worker-owned and panel close must retire its actual resource owners.
   */
  refresh(displayed: IAutoMovieHumanPersonDocument): void;
}
