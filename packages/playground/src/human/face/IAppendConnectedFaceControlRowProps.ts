import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * What one control row needs: where it goes, how its ids are prefixed, the search query it must match, and the panel's transaction and refusal.
 *
 * The row submits a candidate document; a void transaction completion does not itself establish successful admission, because the panel can report refusal through its status owner.
 *
 * @evidence contracts/common.md#principled-implementation Search and simple/fine id prefixing are presentation inputs, while candidate changes pass through the parent's transaction and explicit refusal/redraw hooks.
 * @evidence contracts/common.md#clear-and-simple-design Row DOM and event conversion receive only their required seams; document admission, history and committed state remain panel-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Void completion is not asserted to mean accepted geometry, and the row does not replace refusal with a guessed control value.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies search and id conventions, transaction submission and the absence of a success verdict in the void promise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This row mounting schema implements no filtering or DOM creation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The hooks declare no numerical or asynchronous result cache across inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent supplies DOM and transaction references; this type creates no listener or external handle.
 *
 * @author Samchon
 */
export interface IAppendConnectedFaceControlRowProps {
  /** The element the row is appended to. */
  target: HTMLElement;

  /** Whether the row is a simple coordinate (its ids are prefixed differently). */
  simple: boolean;

  /** The lowercase, space-free search query; a non-matching row is skipped. */
  query: string;

  /**
   * Submit a candidate through the panel; settlement can include a reported refusal and is not a boolean admission verdict.
   *
   * @evidence contracts/common.md#principled-implementation Candidate documents enter the shared panel transaction rather than becoming row-local published geometry.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous handoff leaves history and document/model agreement with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Promise completion alone is not interpreted as successful numerical admission.
   * @evidence contracts/common.md#meaningful-documentation The callback documents submission and the void completion's refusal-inclusive meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This transaction signature selects no builder or history algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authored document submission is an effect with no declared merging of separate inputs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frames and numerical requests belong to the supplied transaction owner.
   */
  change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;

  /**
   * Report row conversion or candidate-edit refusal through the parent status owner.
   *
   * @evidence contracts/common.md#principled-implementation Failed input and candidate assembly report through the same parent refusal boundary as other face edits.
   * @evidence contracts/common.md#clear-and-simple-design The row delegates error presentation instead of owning recovery or committed state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed input receives no invented accepted coordinate.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies conversion/edit refusal and parent status ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This refusal signature chooses no error formatting or rollback algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refusal publication is an effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation acquires no frame, worker or native listener.
   */
  refuse: (error: unknown) => void;

  /**
   * Redraw using the parent's current draft after a row-level refusal; the parent decides which document that draft represents.
   *
   * @evidence contracts/common.md#principled-implementation Redraw obtains values from the parent state owner rather than restoring an earlier row snapshot.
   * @evidence contracts/common.md#clear-and-simple-design The shared controls renderer owns row replacement and the panel owns draft recovery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Redraw is not claimed to imply rollback or numerical admission that this callback does not perform.
   * @evidence contracts/common.md#meaningful-documentation The member identifies current-draft rendering and the parent's recovery decision.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This redraw signature chooses no control traversal or DOM construction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work DOM redraw is a publication effect and declares no numerical cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Old row and listener lifetime belongs to the supplied renderer's replacement path.
   */
  render: () => void;
}
