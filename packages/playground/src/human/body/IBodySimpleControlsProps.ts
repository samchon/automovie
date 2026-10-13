import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * Inputs of `renderBodySimpleControls`: where the simple tier is drawn, its off-thread solvers, the panel's intent hooks, and where its whole-person readings come from. The panel owns document history and intent generations; the controls own typed inputs and projection readback. Stature and mass refer to the named whole-person source, including its head, rather than the body partition alone.
 *
 * @evidence contracts/common.md#principled-implementation Separate projection and expansion callbacks preserve the detailed document as canonical state, while intent tickets prevent a slow numerical answer from replacing newer authored edits.
 * @evidence contracts/common.md#clear-and-simple-design The simple tier receives its DOM mount, numerical operations and panel hooks directly, keeping typed field state local and full-document transactions in the parent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-person readings retain an explicit source label and asynchronous refusals have a dedicated hook; no fixed stature or mass is substituted for unavailable measurements.
 * @evidence contracts/common.md#meaningful-documentation Callback comments explain latest-input access, ticket validity, refusal and status ownership, while the interface comment identifies head-dependent measurement provenance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These injected operation types select no inverse or projection algorithm; the worker solvers and mounted control implementation own evaluation costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input schema provides complete projection dependencies and ticket access but implements no in-flight sharing or accepted-result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Mount elements and callbacks are supplied references; the control and panel implementations own retained inputs, worker requests and retirement.
 *
 * @author Samchon
 */
export interface IBodySimpleControlsProps {
  /** Document that creates the control elements. */
  dom: Document;

  /** Element the controls replace their children in. */
  container: HTMLElement;

  /**
   * Expand simple targets over the detailed shape off the page thread. Rejects when the numerical owner cannot admit or reach the targets; the base shape is preserved as caller input.
   *
   * @evidence contracts/common.md#principled-implementation Expansion receives both simple targets and the detailed base so the numerical inverse can preserve residual detailed traits outside the simple tier.
   * @evidence contracts/common.md#clear-and-simple-design The promise returns detailed weights only, leaving document composition and publication with the panel's apply hook.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The expansion contract exposes numerical refusal rather than inventing replacement targets or editing the caller's base in place.
   * @evidence contracts/common.md#meaningful-documentation The member states off-thread evaluation, unreachable-target rejection and caller ownership of the detailed base.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This expansion callback declaration delegates inverse sampling and channel traversal to its supplied worker implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback has no memoization contract; the controls gate its result by the complete body and current intent.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The promise interface acquires no worker by itself; request lifetime and retirement belong to the injected transport.
   */
  expand: (
    simple: IAutoMovieHumanBodySimpleShape,
    over: Record<string, number>,
  ) => Promise<Record<string, number>>;

  /**
   * Read simple values from a body's effective rest shape off the page thread, using its anatomy and the declared whole-person source. Rejects on numerical refusal.
   *
   * @evidence contracts/common.md#principled-implementation Projection reads a full body input rather than channel weights alone, because anatomical targets can change the shape being measured.
   * @evidence contracts/common.md#clear-and-simple-design The reader returns simple numerical values without writing inputs or committing a body document, leaving display with the mounted controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Readback comes from the effective body and whole-person source rather than a remembered simple input or display-rounded target.
   * @evidence contracts/common.md#meaningful-documentation The projection member identifies rest-shape anatomy, whole-person measurement context, off-thread execution and refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No measurement traversal is implemented in this reader signature; the supplied numerical projection owns that cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reader type stores no completed projection; the controls compare body dependencies before invoking it again.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Projection completion is exposed through a promise while the worker transport owns its queued and active request resources.
   */
  project: (body: IBodySimpleBody) => Promise<IAutoMovieHumanBodySimpleShape>;

  /**
   * Where stature and mass are read: the whole person and the head it was read with, shown beside those two rows because the body alone does not determine them.
   */
  wholeSource: string;

  /**
   * Read the latest body input the expansion applies over, including anatomy and any whole-person context key.
   *
   * @evidence contracts/common.md#principled-implementation Current input is read at operation time so expansion composes with detailed edits newer than the last painted projection.
   * @evidence contracts/common.md#clear-and-simple-design A body-only getter hides the panel's history and viewport while exposing the numerical dependencies the simple tier needs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The current getter supplies pending authored dependencies instead of silently applying over the initial document.
   * @evidence contracts/common.md#meaningful-documentation The member names latest-body access and explicitly includes anatomy and whole-person context in that input.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The current-body signature selects no document storage or cloning algorithm for the panel.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fresh input access does not assert equality with an earlier projected body or implement result reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reading authored body data creates no renderer handle or task lifetime in this declaration.
   */
  current: () => IBodySimpleBody;

  /**
   * Reserve the panel's intent generation synchronously at Apply click, before asynchronous expansion starts.
   *
   * @evidence contracts/common.md#principled-implementation Reserving before the first await establishes the user's edit order independently of worker completion order.
   * @evidence contracts/common.md#clear-and-simple-design A numeric ticket keeps shared body-intent ownership in the panel rather than introducing a second control-local document generation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ticket reservation represents an actual user intent and is not inferred from solver duration or equality of eventual shapes.
   * @evidence contracts/common.md#meaningful-documentation The member places synchronous reservation at Apply and before the asynchronous expansion boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This ticket-allocation type defines no counter implementation or pending-work traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reserving an edit is an effect and the signature specifies no sharing with equal earlier Apply clicks.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A numeric intent ticket owns no external resource; the panel decides which pending build it supersedes.
   */
  reserveIntent: () => number;

  /**
   * Read the panel's current intent generation without reserving a new edit.
   *
   * @evidence contracts/common.md#principled-implementation A read-only generation snapshot binds a background projection's refusal to the body intent that was current when it began.
   * @evidence contracts/common.md#clear-and-simple-design Keeping generation access separate from reservation lets readback observe ordering without withdrawing a user edit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor uses the panel's shared body intent rather than treating unchanged shape as proof that no later pose edit occurred.
   * @evidence contracts/common.md#meaningful-documentation Its comment distinguishes observation of the current generation from creating a new editing intent.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This generation-access signature implements no numerical or document traversal algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading an intent generation has no declared cached numerical result or cross-request work sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Generation observation returns a scalar with no handle or running task to release.
   */
  currentIntent: () => number;

  /**
   * Whether a reserved ticket still names the latest body intent, including edits outside the simple tier.
   *
   * @evidence contracts/common.md#principled-implementation Ticket validity uses the panel-wide edit order so pose, history and detailed-body actions can supersede a simple expansion.
   * @evidence contracts/common.md#clear-and-simple-design The simple tier asks one predicate instead of duplicating the panel's complete set of document-changing events.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Intent validity is not approximated by equal shapes, elapsed time or an unchanged simple input field.
   * @evidence contracts/common.md#meaningful-documentation The validity comment includes body edits outside these controls as possible reasons a ticket becomes stale.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This predicate declaration chooses no generation representation or validity-check implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validity controls admission of effects and does not establish reusable numerical equivalence between intents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The predicate observes a scalar ticket and takes no ownership of the task whose publication it gates.
   */
  isCurrentIntent: (ticket: number) => boolean;

  /**
   * Hand the expanded weights, reserved ticket and simple targets to the panel for document admission and age-related posture composition.
   *
   * @evidence contracts/common.md#principled-implementation The apply handoff preserves both canonical detailed weights and their simple provenance, allowing the panel to compose posture without persisting a second shape representation.
   * @evidence contracts/common.md#clear-and-simple-design One panel callback receives the numerical result and intent context; the simple controls do not mutate document history or publish geometry themselves.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The ticket accompanies the solved shape instead of assuming a completed inversion is still authorized to replace the current draft.
   * @evidence contracts/common.md#meaningful-documentation The member names document admission, ticket ownership and why simple targets remain available for posture composition.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This apply signature selects no document composition, body build or history algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Applying a user intent is an effectful handoff and declares no deduplication based only on equal solved weights.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Solved weights and their provenance are data transfers; the panel owns ensuing build tasks and admitted frames.
   */
  onApply: (
    shape: Record<string, number>,
    ticket: number,
    simple: IAutoMovieHumanBodySimpleShape,
  ) => void;

  /**
   * Report a still-current expansion or projection refusal; the document transaction retains its last admitted state.
   *
   * @evidence contracts/common.md#principled-implementation Unknown refusal causes are handed to the panel's existing error path so a failed numerical operation cannot become a successful document edit.
   * @evidence contracts/common.md#clear-and-simple-design Error reporting stays with the document-status owner rather than introducing a separate simple-tier failure surface.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal is reported without retrying against a fabricated shape or replacing the last valid document with partial numerical output.
   * @evidence contracts/common.md#meaningful-documentation The comment limits reporting to current work and states that the transaction retains the last admitted document.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This refusal-notification member declares no error formatting or recovery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A refusal notification is an observable effect and the signature does not share it across different user intents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The unknown cause is borrowed error data; this callback type owns no rejected request or worker cleanup.
   */
  onRefuse: (error: unknown) => void;

  /**
   * Show the current simple expansion's busy text through the panel status owner.
   *
   * @evidence contracts/common.md#principled-implementation Busy text describes an ongoing expansion without asserting a successful reading or modifying the authored body.
   * @evidence contracts/common.md#clear-and-simple-design Status presentation is injected from the panel so numerical controls need no separate global status store.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A busy notification carries no synthetic progress percentage or elapsed-time completion claim.
   * @evidence contracts/common.md#meaningful-documentation The callback comment identifies the expansion state and the panel that presents its text.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This status callback type chooses no DOM update or rendering strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Busy notifications are user-visible effects with no declared sharing based on matching strings.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Text notification acquires no timer, worker or status element in this declaration.
   */
  onBusy: (text: string) => void;

  /**
   * Restore a ready draft status when typing supersedes the active simple expansion; the numerical request may still finish later.
   *
   * @evidence contracts/common.md#principled-implementation Input-draft invalidation has a separate notification because typing can retire an expansion's UI effect without immediately changing the detailed body.
   * @evidence contracts/common.md#clear-and-simple-design The panel restores its own ready status while the controls keep local edited-field and expansion generation state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Restoring draft status does not certify worker cancellation or accept the superseded expansion result.
   * @evidence contracts/common.md#meaningful-documentation The member explains typed-draft retirement and explicitly allows the obsolete numerical request to finish later.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This draft-status hook implements no worker cancellation or request-queue algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A new typed draft invalidates an effect; this declaration provides no result cache or intent coalescing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Draft notification owns no numerical task and does not transfer responsibility for retiring its transport request.
   */
  onDraftChanged: () => void;

  /**
   * Mark initial simple-tier preparation active or inactive around the first projection attempt, including refusal.
   *
   * @evidence contracts/common.md#principled-implementation Initial projection preparation is distinguished from user expansion so the panel can describe loading readback without presenting it as an authored edit.
   * @evidence contracts/common.md#clear-and-simple-design A boolean lifecycle signal leaves status composition with the panel while the simple controls own when their first read begins and settles.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Clearing preparation states completion of the initial attempt, including failure, rather than guaranteeing a valid simple reading.
   * @evidence contracts/common.md#meaningful-documentation The operation comment identifies the initial attempt and both success and refusal as preparation-ending outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No preparation scheduling or projection strategy is implemented by this boolean callback declaration.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation lifecycle signals coordinate presentation rather than share equivalent numerical evaluations.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The preparation flag carries no ownership of loaded source data or a resident worker connection.
   */
  onPreparing: (active: boolean) => void;
}
