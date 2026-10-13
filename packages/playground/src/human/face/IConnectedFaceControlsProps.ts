import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceComponentTree,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * What the connected face controls read and call: the admitted basis, the optional simple map and component tree, the current draft, and the panel's transaction and refusal owners.
 *
 * Without a simple map, controls use fine channels only; without a component tree, fine rows remain ungrouped. Simple projection retains one captured fine origin while combining pending group values, and fine edits compose with the latest draft. Void transaction settlement can include a panel-reported refusal.
 *
 * @evidence contracts/common.md#principled-implementation Basis-bound optional simple projection and component navigation preserve canonical channel state while current document access and the shared transaction retain pending edits and admission authority.
 * @evidence contracts/common.md#clear-and-simple-design Control presentation and candidate composition receive their map/tree inputs without moving full document history or numerical publication from the panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional projection absence selects fine controls rather than invented simple coordinates, and void transaction completion does not prove admission.
 * @evidence contracts/common.md#meaningful-documentation The comment explains missing map/tree behavior, captured simple origin, latest-draft fine composition and refusal-inclusive completion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This mounting contract implements no projection, channel filtering or tree rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Inputs carry maps and draft hooks without selecting numerical cache identity or invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed basis and callback references acquire no listeners or numerical frames; the control mount owns resulting DOM lifetime.
 *
 * @author Samchon
 */
export interface IConnectedFaceControlsProps {
  /** The admitted face basis whose channels the controls list. */
  basis: IAutoMovieHumanFaceBasis;

  /** The simple coordinate map, when the basis has one. */
  map?: IAutoMovieHumanFaceControlMap;

  /** The component tree that groups fine controls for navigation. */
  components?: IAutoMovieHumanFaceComponentTree;

  /**
   * Read current authored draft for redraw and input composition, including newer pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Current draft access keeps canonical authored values distinct from projected simple display coordinates.
   * @evidence contracts/common.md#clear-and-simple-design The panel remains the single draft owner while the control mount reads its state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fine edits preserve newer unrelated fields instead of writing a painted document snapshot.
   * @evidence contracts/common.md#meaningful-documentation The member identifies both redraw and event-time access to pending authored state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This getter declares no projection or state-copy algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft observation selects no shared numerical result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned authored data is borrowed from the panel with no acquired worker or frame.
   */
  document: () => IAutoMovieHumanFaceBasisDocument;

  /**
   * Submit the composed candidate to the face transaction; void settlement includes reported refusal and supplies no success verdict.
   *
   * @evidence contracts/common.md#principled-implementation Both simple-lowered and fine-channel candidates pass through the same complete document admission and history owner.
   * @evidence contracts/common.md#clear-and-simple-design One transaction seam serves both presentation modes without duplicating numerical validation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Simple projection does not bypass canonical document admission or treat promise settlement as acceptance.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies composed-candidate submission and refusal-inclusive void completion.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This transaction type chooses no builder or history publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authored changes retain distinct effects and this signature declares no cached result sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The supplied transaction owns asynchronous build and frame retirement responsibilities.
   */
  change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;

  /**
   * Report row conversion or projection-lowering refusal through the parent while preserving committed state.
   *
   * @evidence contracts/common.md#principled-implementation Invalid display entry or lowering reports through the panel's shared refusal and draft recovery owner.
   * @evidence contracts/common.md#clear-and-simple-design The controls do not implement a second history rollback or status element.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused simple or fine coordinates receive no guessed admitted replacement.
   * @evidence contracts/common.md#meaningful-documentation The operation comment identifies input/lowering failures and committed-state preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This refusal signature chooses no error formatting or control rebuild algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reporting current refusal is an effect rather than reusable numerical evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback acquires no listener, worker or display resource.
   */
  refuse: (error: unknown) => void;
}
