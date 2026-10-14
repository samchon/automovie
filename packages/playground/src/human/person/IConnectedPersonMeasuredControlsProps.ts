import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonMeasuredSolution } from "@automovie/human/human/runtime/IConnectedPersonMeasuredSolution";

/**
 * What the person measurement controls render into and call: the container, the current person, the panel's intent tickets, the off-thread reader and solver, and the panel's transaction, status and refusal owners. The reader measures complete-person final rest skin and section assembly blocks construction-draft reads. A solve changes one body channel within paired support and returns its final Float32 reading plus requested-target source-sample membership; the current panel transaction separately admits that candidate.
 *
 * @evidence contracts/common.md#principled-implementation Registered whole-person measurements use one-skin rest evaluation and paired head/body channel support, with shared current intent controlling complete-candidate admission.
 * @evidence contracts/common.md#clear-and-simple-design The section borrows draft, numerical operations and panel authority without owning a separate compiled evaluator or history transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An outside-sample target remains labelled rather than clamped, missing head driver support refuses and numerical completion is not editor or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies final rest-skin provenance, paired support, single-channel solve, draft-read gate, source-sample meaning and separate admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callback schema implements no one-skin evaluation, bounded inverse or section rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Numerical hooks declare no cached result identity across full person documents and target values.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources DOM and callbacks are borrowed and allocate no compiled generation or prepared frame in the declaration.
 *
 * @author Samchon
 */
export interface IConnectedPersonMeasuredControlsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are rendered into. */
  container: HTMLElement;

  /**
   * Read the latest complete person draft when composing a person measurement edit, including pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Event-time complete draft access preserves newer body and face edits while changing one person measurement candidate field.
   * @evidence contracts/common.md#clear-and-simple-design Person measurement controls borrow draft observation while the panel retains mutable draft and history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A painted person measurement field snapshot is not replayed over unrelated pending fields.
   * @evidence contracts/common.md#meaningful-documentation The member explains current complete draft access and pending-field preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The getter signature chooses no draft representation or copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft observation declares no reusable numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned data remains panel-owned and this getter acquires no task or handle.
   */
  current: () => IAutoMovieHumanPersonDocument;

  /**
   * Reserve a whole-person action ticket before its asynchronous transaction.
   *
   * @evidence contracts/common.md#principled-implementation Person measurement actions reserve the same intent sequence as body, face and history edits before awaiting work.
   * @evidence contracts/common.md#clear-and-simple-design The panel exposes reservation without giving person measurement controls a competing mutable gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal person measurement target values do not authorize reuse of an older action ticket.
   * @evidence contracts/common.md#meaningful-documentation The callback names whole-person authority and pre-await reservation timing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The reservation type implements no counter or exhaustion strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New authored intent is an effect rather than cached numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ticket issuance acquires no worker or prepared frame.
   */
  reserve: () => number;

  /**
   * Whether this whole-person ticket still authorizes completion status and reports.
   *
   * @evidence contracts/common.md#principled-implementation Current intent suppresses late person measurement completion and refusal after newer person actions.
   * @evidence contracts/common.md#clear-and-simple-design The predicate borrows panel authority without exposing its internal gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching person measurement candidate fields do not establish that no later body or history intent exists.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person completion and reporting authorization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The predicate signature chooses no intent comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authority validity is distinct from numerical result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observing a ticket acquires no independent running task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Read one registered complete-person measurement on final skin at rest in metres; actual section assembly blocks construction-draft access.
   *
   * @evidence contracts/common.md#principled-implementation Registered channel identity selects the whole-person instrument on final rest skin rather than a body-only proxy.
   * @evidence contracts/common.md#clear-and-simple-design The callback returns one metre reading while section formatting and admitted-state access stay with their owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable or draft construction receives refusal rather than a fabricated accepted-person measurement.
   * @evidence contracts/common.md#meaningful-documentation The member identifies registered channel, complete-person rest provenance, metre units and the actual draft-read gate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The read type selects no instrument or rest-construction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no cached reading equivalence across document or channel changes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending request and compiled evaluator lifetime belong to the supplied numerical runtime.
   */
  read: (
    document: IAutoMovieHumanPersonDocument,
    channel: string,
  ) => Promise<number>;

  /**
   * Solve one registered measurement target in metres along its paired body channel, preserving other authored fields and returning final Float32 rest-skin readback.
   *
   * @evidence contracts/common.md#principled-implementation Each trial builds the complete person within paired channel support, with one-channel inversion and a final rest-skin reading on the returned candidate.
   * @evidence contracts/common.md#clear-and-simple-design Numerical candidate production and requested-target sample metadata remain separate from current-ticket panel admission and history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing head endpoint drivers refuse by name, other channels do not hide a target miss and source-sample bounds are not personal feasibility clamps.
   * @evidence contracts/common.md#meaningful-documentation The callback explains metre target units, paired support, preserved authored fields, final Float32 readback and separate admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The solve type selects no bracket iteration, construction or readback algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct document/channel/target inputs declare no cached inverse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Solver requests and numerical generation retention remain worker-owned until their transport settles or closes.
   */
  solve: (
    document: IAutoMovieHumanPersonDocument,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedPersonMeasuredSolution>;

  /**
   * Submit a complete person candidate under the reserved ticket. True means current publication of either an accepted person or a labelled construction draft; panel state identifies accepted history. False includes closed, superseded, refused or failed settlement and does not prove that no earlier publication occurred.
   *
   * @evidence contracts/common.md#principled-implementation Person measurement changes pass through complete person admission and panel history authority under their shared ticket.
   * @evidence contracts/common.md#clear-and-simple-design One candidate handoff leaves numerical construction, display and accepted history with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid person measurement candidate field cannot bypass body/face admission or declare false completion an accepted commit.
   * @evidence contracts/common.md#meaningful-documentation The member specifies complete document input, explicit ticket and refusal or supersession outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no construction, history or frame publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct authored transactions are not merged by equal-looking person measurement candidate fields.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frame retention and stale candidate retirement remain transaction-owned.
   */
  change: (
    document: IAutoMovieHumanPersonDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Show requested person measurement work separately from its admission outcome.
   *
   * @evidence contracts/common.md#principled-implementation Busy text describes the requested person measurement transaction before its terminal outcome.
   * @evidence contracts/common.md#clear-and-simple-design The section supplies status text while the panel owns presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts In-progress text is not a completed geometry or admission verdict.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies requested work and separate admission outcome.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type chooses no DOM update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Busy status publication is an effect rather than reusable numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Status DOM and its retained text remain panel-owned.
   */
  busy: (text: string) => void;

  /**
   * Append a current completed transaction's report through the panel status owner; publication may be a labelled construction draft rather than accepted history.
   *
   * @evidence contracts/common.md#principled-implementation Person measurement consumers report only after true completion while their ticket remains current.
   * @evidence contracts/common.md#clear-and-simple-design The section composes the line and the panel retains report presentation and history state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts False or superseded completions do not append this report; a true labelled construction draft retains its refusal qualification and is not promoted to accepted history by reporting.
   * @evidence contracts/common.md#meaningful-documentation The member requires current true publication and leaves accepted-versus-construction-draft classification with the panel.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback selects no string accumulation or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reports are authored presentation effects without numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained report text belongs to the panel rather than this signature.
   */
  report: (text: string) => void;

  /**
   * Report invalid person measurement input or current transaction refusal while preserving the last-valid person.
   *
   * @evidence contracts/common.md#principled-implementation The parent refusal owner coordinates person measurement input validation with person draft and displayed state recovery.
   * @evidence contracts/common.md#clear-and-simple-design Person measurement controls supply the cause while the panel owns last-valid state and refusal presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid geometric combinations receive no guessed accepted replacement values.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input and transaction refusal with last-valid person preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal type selects no recovery or DOM algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current refusal reporting does not share a numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending numerical and frame retirement remain the transaction owner's responsibility.
   */
  refuse: (error: unknown) => void;
}
