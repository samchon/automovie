import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";

/**
 * Where the body editor's companion head is shown and reported. The viewport getter is late-bound because the seat is created first. Source authority is passed to body-document serialization; omitting it preserves that serializer's admission rules without supplying a substitute source.
 *
 * @evidence contracts/common.md#principled-implementation A late viewport getter respects construction order and pairs the companion request with the actual loaded source authority used to serialize its body document.
 * @evidence contracts/common.md#clear-and-simple-design The seat receives only companion access and body-status hooks, keeping the body viewport's other controls and document history outside its contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source authority is not replaced by bundled raw geometry, and head preparation status does not imply clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The interface comment explains late binding, serialization authority and source absence; callback comments distinguish status and initial preparation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This seat-input type selects no head evaluation, renderer preparation or document encoding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema declares dependencies and accessors without caching head generations or sharing prepared companions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Companion renderer and worker resources belong to the seat implementation; these supplied references acquire none themselves.
 *
 * @author Samchon
 */
export interface IConnectedBodyHeadSeatProps {
  /** Actual loaded body source authority for companion document serialization; absent sources retain legacy admission. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;

  /**
   * Read companion access when a head arrives, after the page viewport has been created.
   *
   * @evidence contracts/common.md#principled-implementation Late access avoids reading an uninitialized viewport when the companion seat is constructed earlier in page setup.
   * @evidence contracts/common.md#clear-and-simple-design Picking companion alone exposes exactly the placement and display boundary the seat uses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The real page companion is resolved at use time rather than replaced with a mock viewport during initialization.
   * @evidence contracts/common.md#meaningful-documentation The callback comment places access after viewport creation and at head arrival.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This getter type chooses no companion lookup or renderer update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Access to the page viewport does not assert equivalence of separate head builds.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned companion remains owned by the existing viewport rather than acquired by the getter.
   */
  viewport: () => Pick<
    ReturnType<typeof createConnectedBodyViewport>,
    "companion"
  >;

  /**
   * Append head availability or cleanup information to the current body status.
   *
   * @evidence contracts/common.md#principled-implementation Head status is appended after body status so companion failures remain visible without replacing the body's transaction outcome.
   * @evidence contracts/common.md#clear-and-simple-design The seat reports text through the body's status owner instead of creating a second error panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Head or cleanup failure remains reported rather than being converted into an apparently successful companion build.
   * @evidence contracts/common.md#meaningful-documentation The member identifies companion availability and cleanup as status content beside the body outcome.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The status callback declaration implements no message composition or DOM update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Companion-status delivery is an effect and has no declared sharing across body generations.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Text retention is owned by the parent status sink, not this head-status member.
   */
  status: (text: string) => void;

  /**
   * Optionally mark initial head preparation until its current first attempt succeeds or refuses.
   *
   * @evidence contracts/common.md#principled-implementation A separate preparation signal distinguishes initial companion loading from the body document's own build state.
   * @evidence contracts/common.md#clear-and-simple-design An optional boolean hook lets pages compose head preparation status without requiring another UI owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Inactive preparation marks settled work, including refusal, rather than certifying that a head is displayed.
   * @evidence contracts/common.md#meaningful-documentation The callback explains optional reporting and both success and refusal as initial-attempt outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This lifecycle hook selects no head loading or progress scheduling strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation flags describe one seat lifecycle and are not shared numerical results.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The flag carries no ownership of the head worker or prepared companion frame.
   */
  preparing?: (active: boolean) => void;
}
