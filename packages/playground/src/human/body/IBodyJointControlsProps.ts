import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Inputs of `mountBodyJointControls`: the joint picker and the selected joint's controls bound to the latest body draft.
 *
 * `current` reads the latest draft; `change` submits an edited document and `refuse` returns an unsupported pending shape to the panel's transaction owner. Bone selection stays outside the document.
 *
 * @evidence contracts/common.md#principled-implementation Joint edits read the latest draft and submit authored coordinates through the panel's transaction, while the selected bone remains inspection state rather than body data.
 * @evidence contracts/common.md#clear-and-simple-design The mount receives its DOM target, admitted joint basis and document hooks directly; history, rig evaluation and frame publication stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending shape that cannot supply joint rest returns through refusal, without replacing its rest with a stale frame or mutating the basis.
 * @evidence contracts/common.md#meaningful-documentation The interface explains current-draft composition, submission rather than guaranteed publication, refusal ownership and nonserialized bone selection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This joint-mount schema selects no pose resolver, joint filtering or control-rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current-state access and redraw hooks declare no cache of resolved joints or shared pending builds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The DOM target and basis are panel-owned references; listeners and build resources are acquired by their implementation owners.
 *
 * @author Samchon
 */
export interface IBodyJointControlsProps {
  /** Document the controls are created in. */
  dom: Document;

  /** Element whose children the controls replace. */
  container: HTMLElement;

  /** Admitted basis declaring the joints. */
  basis: IAutoMovieHumanBodyBasis;

  /** Initially selected bone. */
  bone: AutoMovieHumanoidBone;

  /** Joint filter text. */
  query: string;

  /**
   * Read the latest pending draft, including edits whose body build has not completed.
   *
   * @evidence contracts/common.md#principled-implementation Event-time document access retains newer joint and shape edits when another action is still building.
   * @evidence contracts/common.md#clear-and-simple-design A document getter leaves history and publication internals outside the joint picker.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The getter supplies pending authored state rather than the last rendered body's stale document.
   * @evidence contracts/common.md#meaningful-documentation The member explicitly includes pending edits whose build has not completed.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This latest-draft signature implements no document lookup or snapshot algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading pending state carries no declared equivalence to previously resolved joint rest.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned body document is data and gives the getter no renderer or worker ownership.
   */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /**
   * Record a new inspected bone outside the authored body document.
   *
   * @evidence contracts/common.md#principled-implementation Selected bone is inspection state because choosing a control does not author a joint motion.
   * @evidence contracts/common.md#clear-and-simple-design The panel stores selection while the picker only reports the closed bone identity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Selecting a bone neither inserts a neutral pose row nor rewrites the body document.
   * @evidence contracts/common.md#meaningful-documentation The selection comment states its inspection role and exclusion from authored body data.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This selection callback type chooses no state-storage or redraw algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selection is a UI effect with no declared numerical work reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The bone identity is a scalar value without an acquired handle or running task.
   */
  select: (bone: AutoMovieHumanoidBone) => void;

  /**
   * Ask the panel to redraw controls after inspection selection changes.
   *
   * @evidence contracts/common.md#principled-implementation Redrawing after selection rebuilds controls for the newly inspected joint without submitting an authored motion.
   * @evidence contracts/common.md#clear-and-simple-design The mount delegates redraw to its parent instead of duplicating complete control routing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Redraw does not stand in for a body build or certify geometry appearance.
   * @evidence contracts/common.md#meaningful-documentation The callback names selection as the trigger and control redraw as its effect.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This redraw declaration implements no DOM reconstruction or joint-routing strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repainting controls has no declared cached output or shared listener identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The redraw provider owns replaced nodes and listeners; this member acquires none itself.
   */
  redraw: () => void;

  /**
   * Submit an edited draft to the panel transaction; this synchronous notification does not promise admission or publication.
   *
   * @evidence contracts/common.md#principled-implementation Joint edits submit a complete next document through the existing body admission path rather than publishing a partial rig result.
   * @evidence contracts/common.md#clear-and-simple-design A void notification suits the mount's event path while the panel owns asynchronous body construction and history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returning from submission is not treated as numerical acceptance or successful frame publication.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes synchronous edit handoff from the transaction's later admission and publication.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No document commit or geometry-build algorithm is implemented in this handoff signature.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authored document submission is an effect and declares no deduplication of equal pending edits.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The panel owns any subsequent build and prepared frame; this notification transfers only document data.
   */
  change: (document: IAutoMovieHumanBodyBasisDocument) => void;

  /**
   * Return joint-rest or pose-resolution refusal to the transaction owner, retaining the last admitted body.
   *
   * @evidence contracts/common.md#principled-implementation Unsupported pending state returns its actual cause to the same owner that admits body transactions.
   * @evidence contracts/common.md#clear-and-simple-design The joint picker uses the existing refusal path instead of managing a second committed-document state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal prevents stale rest substitution and does not turn failed pose resolution into an accepted edit.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies rest and pose failures and preservation of the last admitted body.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This error callback selects no recovery or status-formatting algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reporting a failed pending edit has no declared sharing across different document intents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The refusal cause is ordinary data; transaction and viewport owners retire any associated tasks or frames.
   */
  refuse: (error: unknown) => void;
}
