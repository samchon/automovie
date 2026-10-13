import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";

/**
 * The latest warm failure with when and on which revision it happened.
 *
 * @evidence contracts/common.md#principled-implementation The latest warm failure keeps its original document/reason plus failure time and pass revision.
 * @evidence contracts/common.md#clear-and-simple-design Extending the existing failure record adds chronology without duplicating failure identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resetting a pass's counters does not erase the independently retained latest failure.
 * @evidence contracts/common.md#meaningful-documentation Documents ISO failure time and the source revision associated with the preserved error.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The latest warm failure keeps its original document/reason plus failure time and pass revision.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Extending the existing failure record adds chronology without duplicating failure identity.
 * @author Samchon
 */
export interface IHumanViewerWarmLastFailure extends IHumanViewerWarmFailure {
  /**
   * ISO time of the failure.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review ISO time of the failure. The latest warm failure keeps its original document/reason plus failure time and pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review ISO time of the failure. Extending the existing failure record adds chronology without duplicating failure identity.
   */
  at: string;

  /**
   * The source revision the pass warmed.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The source revision the pass warmed. The latest warm failure keeps its original document/reason plus failure time and pass revision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The source revision the pass warmed. Extending the existing failure record adds chronology without duplicating failure identity.
   */
  revision: string;
}
