import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IConnectedBodyReach } from "../common/IConnectedBodyReach";
import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";

/**
 * Inputs of `renderConnectedBodyControls`: where the controls go, which group and search text select them, what the body view can evaluate, and the panel's transaction hooks. Pose controls use the full admitted basis; measured controls use only the loaded view's evaluable reach. Target drafts are UI text, and the shared panel ticket orders asynchronous solves against every body edit.
 *
 * @evidence contracts/common.md#principled-implementation Full joint declarations and measurable shape reach remain distinct, so control routing can show supported pose edits while limiting inversions to quantities the loaded body can evaluate.
 * @evidence contracts/common.md#clear-and-simple-design This routing input delegates pose and measurement rows to their renderers while sharing one document transaction and status owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable quantities remain visible as limitations rather than gaining fabricated controls, and draft text is not serialized as body geometry.
 * @evidence contracts/common.md#meaningful-documentation The interface distinguishes full basis from measured reach, latest selection getters, nonserialized target drafts and panel-wide intent ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The routing schema selects no numerical inverse or DOM reconstruction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied scale and draft maps are state references, without a declared cache of control renders or solved requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The panel owns DOM, basis and maps; renderer and solver implementations own listeners, frames and active requests.
 *
 * @author Samchon
 */
export interface IConnectedBodyControlsProps {
  /** Document that creates the control elements. */
  dom: Document;

  /** Element the controls replace their children in. */
  container: HTMLElement;

  /**
   * Read the selected measurement group or `pose` when controls are routed.
   *
   * @evidence contracts/common.md#principled-implementation Current group access routes pose separately from measured-channel controls using the actual panel selection.
   * @evidence contracts/common.md#clear-and-simple-design A scalar getter keeps group-selection storage outside the routing renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Group choice is UI state rather than a body-specific shortcut in numerical admission.
   * @evidence contracts/common.md#meaningful-documentation The member identifies measurement groups and pose as the supported routing alternatives.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This group accessor chooses no control-routing or row-filter algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading selected group declares no cached control tree or shared numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned group string owns no listeners, frames or running tasks.
   */
  kind: () => string;

  /**
   * Read search text already lowercased with whitespace removed for channel and joint filtering.
   *
   * @evidence contracts/common.md#principled-implementation The provider normalizes search text once according to the panel's substring-filter convention.
   * @evidence contracts/common.md#clear-and-simple-design Supplying normalized text keeps input-element access out of each control renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Search filters visible controls without changing the authored body's channel values or supported reach.
   * @evidence contracts/common.md#meaningful-documentation The callback states lowercase and whitespace normalization before filtering.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The query signature implements no normalization or substring scan itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Query access carries no memoized row list or numerical work equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Search text is scalar UI data with no resource release obligation.
   */
  query: () => string;

  /** The full body view, whose joints the pose controls bind. */
  basis: IAutoMovieHumanBodyBasis;

  /** What the body view can evaluate; measured controls use its basis. */
  reach: IConnectedBodyReach;

  /** Measured channel scales over the reach basis. */
  scales: Map<string, IAutoMovieHumanBodyChannelScale>;

  /** Typed measurement targets not yet solved, by channel. */
  drafts: Map<string, string>;

  /**
   * Read the currently inspected bone for pose controls, separate from authored motion.
   *
   * @evidence contracts/common.md#principled-implementation Bone selection chooses which coordinates to inspect without becoming an authored joint change.
   * @evidence contracts/common.md#clear-and-simple-design The getter leaves selection storage with the panel and passes a closed bone identity to routing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reading selected bone does not invent neutral rows or alter other pose coordinates.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes inspected bone from authored motion state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This bone accessor chooses no skeleton traversal or joint-resolution algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selection lookup declares no pose cache or equivalence across different bones.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A closed bone value owns no renderer state or numerical request.
   */
  bone: () => AutoMovieHumanoidBone;

  /**
   * Record another inspected joint for the next pose-control redraw.
   *
   * @evidence contracts/common.md#principled-implementation Inspection selection is updated independently of the body document and its numerical admission.
   * @evidence contracts/common.md#clear-and-simple-design The panel receives the selected identity while child routing owns no persistent selection store.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Changing inspected joint does not imply a successful pose edit or geometry rebuild.
   * @evidence contracts/common.md#meaningful-documentation The callback comment places selected-joint use at the next control redraw.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This selection-notification type chooses no control reconstruction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selecting a joint is a UI effect and declares no shared numerical evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The selection value transfers no DOM, renderer or worker ownership.
   */
  select: (bone: AutoMovieHumanoidBone) => void;

  /**
   * Read the latest pending body draft for composing pose edits and measured-channel inputs.
   *
   * @evidence contracts/common.md#principled-implementation Latest-draft access makes independent control groups compose against the same pending authored state.
   * @evidence contracts/common.md#clear-and-simple-design A document getter supplies edit operands without exposing panel history or viewport internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending edits are not discarded by reading only the last completed render document.
   * @evidence contracts/common.md#meaningful-documentation The member identifies pending-state access for both pose composition and measurement solving.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This shared draft signature implements no document cloning or storage strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A current draft read is not a claim that an earlier body evaluation remains reusable.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Authored document access acquires no frame handle or off-thread task.
   */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /**
   * Submit a body document under an existing ticket, or reserve a new intent when omitted. Resolve whether the panel transaction succeeds.
   *
   * @evidence contracts/common.md#principled-implementation An optional ticket lets synchronous pose edits reserve on submission and measured inversions retain the intent reserved before solving.
   * @evidence contracts/common.md#clear-and-simple-design One commit entry unifies pose and shape edits with the panel's admission, history and publication path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Submitted documents still pass numerical admission and stale-ticket checks rather than bypassing them from a control-specific path.
   * @evidence contracts/common.md#meaningful-documentation The callback explains omitted-ticket reservation and distinguishes submission from successful transaction completion.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This shared commit signature chooses no body-build or history management algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Document commits are effects, with no declared sharing merely because submitted shapes compare equal.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Panel and viewport implementations retain document snapshots and prepared frames behind this promise boundary.
   */
  change: (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket?: number,
  ) => Promise<boolean>;

  /**
   * Reserve a new shared body intent and withdraw publication of previous pending work.
   *
   * @evidence contracts/common.md#principled-implementation Intent reservation happens before a measured inverse awaits its worker so later edits remain ordered by user action.
   * @evidence contracts/common.md#clear-and-simple-design The panel is the single ticket authority shared by every routed control group.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Withdrawal gates stale publication without claiming instant completion or destruction of numerical worker tasks.
   * @evidence contracts/common.md#meaningful-documentation The member identifies shared intent reservation and previous-work publication withdrawal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reservation contract implements no worker queue or intent-counter strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reserving an authored intent is an effect and cannot be shared because two requests look equal.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar reservation does not own the frames or active requests whose publication it invalidates.
   */
  reserve: () => number;

  /**
   * Whether an intent remains current before a routed control publishes a result or refusal.
   *
   * @evidence contracts/common.md#principled-implementation One shared predicate orders measured callbacks against pose, history and other shape intents.
   * @evidence contracts/common.md#clear-and-simple-design Child controls query validity without knowing every event that can advance the panel generation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Current intent is not approximated by equal measurements or a worker's reply arrival time.
   * @evidence contracts/common.md#meaningful-documentation The member places validity checks before both result and refusal effects.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The current-intent member selects no generation representation or comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validity concerns effect admission rather than reusable numerical equivalence between tickets.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Checking intent owns no active build, frame or resident worker handle.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Invert one measured channel to a metre-valued target off the page thread; reject unsupported or unreachable targets.
   *
   * @evidence contracts/common.md#principled-implementation The numerical inverse receives the current shape, named channel and physical target rather than exposing internal vertex offsets as authoring controls.
   * @evidence contracts/common.md#clear-and-simple-design A shape-and-achieved-length result serves measured rows while the shared panel retains commit responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreachable targets remain numerical refusals rather than silently clamped controls or fabricated achieved lengths.
   * @evidence contracts/common.md#meaningful-documentation The inverse comment declares metre units, off-thread execution and unsupported or unreachable target rejection.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This routed inverse signature delegates bracketing and body evaluation to the supplied solver.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The operation type declares no shared channel-solve result across different starting shapes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Worker connection and request lifetime belong to the numerical transport behind this promise.
   */
  solve: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;

  /**
   * Present current numerical work as building through the parent body status.
   *
   * @evidence contracts/common.md#principled-implementation Building status distinguishes an ongoing solve from an admitted document without altering authored inputs.
   * @evidence contracts/common.md#clear-and-simple-design The routing layer forwards text to the existing parent status owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A building notification supplies no fake progress percentage or assumed successful outcome.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies parent status presentation and the ongoing numerical state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The shared busy signature implements no rendering or progress-update strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Status changes are visible effects with no declared reuse across matching text.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This notification owns no timer or task used by numerical work.
   */
  busy: (text: string) => void;

  /**
   * Append a current measured-result line without replacing the committed body's status.
   *
   * @evidence contracts/common.md#principled-implementation Additional readback is attached to the committed transaction outcome rather than replacing it with the inverse request target.
   * @evidence contracts/common.md#clear-and-simple-design Text reporting stays with the panel while child controls provide the operation-specific result sentence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reporting follows current successful commitment and cannot establish success from a stale solver answer.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies appended measured output and preservation of existing body status.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This report member declares no string-history or DOM-update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Appending readback is an observable effect and has no cached numerical result semantics.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent owns retained status text; this callback acquires no external resources.
   */
  report: (text: string) => void;

  /**
   * Report an input or numerical refusal through the panel, retaining its last admitted body.
   *
   * @evidence contracts/common.md#principled-implementation Refused control input returns to the document owner so draft recovery and status describe one transaction state.
   * @evidence contracts/common.md#clear-and-simple-design A shared error callback serves routed controls without separate committed-body or failure stores.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed input is not converted to a guessed body or accepted partial numerical output.
   * @evidence contracts/common.md#meaningful-documentation The member names input and numerical refusal and preserves the last admitted body.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This shared refusal declaration chooses no error-formatting or recovery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Failure delivery is intent-bound and declares no sharing between distinct refused edits.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Transaction and viewport owners retain cleanup obligations while this member transfers only the refusal cause.
   */
  refuse: (error: unknown) => void;
}
