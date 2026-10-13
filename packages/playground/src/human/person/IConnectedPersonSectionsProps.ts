import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";

/**
 * Inputs of `mountConnectedPersonSections`: the mounted panel root, the panel's own inputs, the one transaction every section edits through, and whether the displayed person is a draft. Section assembly wraps measurement reads with the draft predicate, while authored solves and complete-person candidates share the panel's intent gate. Simple-tier controls also read the current ticket and restore settled status when their draft changes withdraw a solve.
 *
 * @evidence contracts/common.md#principled-implementation One working person contract and intent authority govern every section, with an explicit draft predicate refusing admitted-only reads.
 * @evidence contracts/common.md#clear-and-simple-design The composition inputs connect existing numerical/panel/control owners without introducing section-local document history or numerical builders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Displayed construction drafts are not measured as accepted people, and a simple-tier cancellation restores status rather than inventing a successful solved candidate.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies shared transaction, draft-read gate, simple intent observation and draft-change status recovery.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This composition type implements no child rendering, numerical reading or transaction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Connected owners declare no section-local numerical cache or geometry reuse identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface borrows DOM, panel and callbacks without acquiring listeners or resident workers itself.
 *
 * @author Samchon
 */
export interface IConnectedPersonSectionsProps<
  Model extends IConnectedPersonModel,
> {
  /** The element holding the mounted panel markup. */
  app: HTMLElement;

  /** The panel's inputs: both partition views and the measurement readers and solvers. */
  panel: IConnectedPersonPanelProps<Model>;

  /** The working document and the transaction that edits it. */
  controls: Omit<IConnectedPersonEyeControlsProps, "container">;

  /**
   * Whether current display is a construction draft, used to refuse admitted-person measurement reads.
   *
   * @evidence contracts/common.md#principled-implementation Draft observation guards measurement access using the panel's actual session state.
   * @evidence contracts/common.md#clear-and-simple-design A predicate exposes the admission distinction without duplicating session ownership inside sections.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Visibility and successful candidate publication do not substitute for accepted-person status.
   * @evidence contracts/common.md#meaningful-documentation The callback names construction-draft display and its measurement-gating purpose.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The predicate type implements no session lookup or reading algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Admission-state observation is not cached numerical equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The predicate acquires no model handle or pending task.
   */
  isDraft: () => boolean;

  /**
   * Observe the panel's current whole-person ticket for the shared simple-tier draft and solve authority.
   *
   * @evidence contracts/common.md#principled-implementation Simple-tier work uses the same action identity as other person controls rather than a competing body-local revision.
   * @evidence contracts/common.md#clear-and-simple-design One observation hook borrows intent authority without granting mutation of the panel's gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal simple values do not authorize an obsolete pending solve after a newer person action.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person intent and simple-tier authority scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The getter type chooses no generation comparison or counter algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Intent observation declares no numerical result sharing or cache key.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ticket access acquires no worker request or frame.
   */
  currentIntent: () => number;

  /**
   * Restore settled panel status after a simple numerical draft change withdrew its in-flight solve.
   *
   * @evidence contracts/common.md#principled-implementation Draft withdrawal ends obsolete pending status while retaining the actual displayed document and admission state.
   * @evidence contracts/common.md#clear-and-simple-design The section signals the panel's status owner rather than editing independent session text.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Withdrawing a solve is not reported as achieved geometry or accepted person admission.
   * @evidence contracts/common.md#meaningful-documentation The callback names draft-change withdrawal and settled-status restoration.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback declaration chooses no cancellation or status update implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Status restoration is an effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The simple transport and viewport retain actual pending task/frame ownership; this signal acquires none.
   */
  draftChanged: () => void;
}
