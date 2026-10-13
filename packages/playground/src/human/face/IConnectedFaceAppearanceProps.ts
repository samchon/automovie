import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";

/**
 * What the face appearance controls read and call: the admitted basis's materials, the current draft and the panel's transaction and refusal owners.
 *
 * Appearance controls read the latest draft at edit time and submit material or pigmentation changes through the same transaction as other face fields. Void completion can include a reported admission refusal.
 *
 * @evidence contracts/common.md#principled-implementation The admitted basis supplies material defaults and latest document access preserves pending unrelated edits before a candidate enters the shared transaction.
 * @evidence contracts/common.md#clear-and-simple-design The appearance mount receives defaults and document/status seams while the panel owns history, admission and model publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A material draft is not accepted geometry merely because a void transaction settles, and errors remain parent-reported refusals.
 * @evidence contracts/common.md#meaningful-documentation The comment states material provenance, latest-draft use, shared transaction ownership and refusal-inclusive settlement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input schema selects no material traversal or numerical builder algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The structure declares no material or frame cache across appearance changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed basis and callback references acquire no DOM listener, texture or renderer handle themselves.
 *
 * @author Samchon
 */
export interface IConnectedFaceAppearanceProps {
  /** The admitted face basis whose materials the controls list. */
  basis: IAutoMovieHumanFaceBasis;

  /**
   * Read the latest draft before editing one appearance field, preserving unrelated pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Latest document access composes a material edit with the parent's current draft rather than painted values.
   * @evidence contracts/common.md#clear-and-simple-design The getter exposes authored state without transferring ownership of panel history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A later edit does not reconstruct unrelated fields from a neutral fixture.
   * @evidence contracts/common.md#meaningful-documentation The callback names event-time access and preservation of pending fields.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This getter selects no document copy or cache strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current draft reads coordinate no shared numerical evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned document data stays panel-owned and acquires no live resource here.
   */
  document: () => IAutoMovieHumanFaceBasisDocument;

  /**
   * Submit the appearance candidate to the face transaction; settlement includes panel-reported refusal and supplies no success verdict.
   *
   * @evidence contracts/common.md#principled-implementation Material candidate changes pass through full face admission and document/model history agreement.
   * @evidence contracts/common.md#clear-and-simple-design One transaction handoff keeps numerical geometry and history outside appearance rows.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Settled void completion is not interpreted as proof of an accepted material or model.
   * @evidence contracts/common.md#meaningful-documentation The member states transaction submission and absence of a boolean success result.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no model build or history update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Appearance admission is effectful and promises no cross-edit result sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transaction owns asynchronous requests and prepared frame retirement.
   */
  change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;

  /**
   * Report invalid appearance entry while retaining the panel's last-valid committed state.
   *
   * @evidence contracts/common.md#principled-implementation Input refusal reports through the same panel owner that preserves admitted document/model state.
   * @evidence contracts/common.md#clear-and-simple-design Error presentation and recovery remain shared panel responsibilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed colour or surface entry receives no guessed successful material.
   * @evidence contracts/common.md#meaningful-documentation The member identifies input refusal and last-valid committed preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback selects no status formatting or rollback algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refusal is a visible effect rather than shared numerical computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation acquires no texture, worker or renderer resource.
   */
  refuse: (error: unknown) => void;
}
