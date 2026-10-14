import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

/**
 * What the eye-region controls render into and call: the container, the current person, the panel's intent tickets, and the panel's transaction, status and refusal owners. The optional registered face owner supplies omitted periocular defaults. Numerical geometry and complete-person admission remain downstream; a false transaction result does not determine whether an earlier publication or accepted history change occurred.
 *
 * @evidence contracts/common.md#principled-implementation Eye edits compose against the current complete draft and share the panel's intent authority with body, face and history actions.
 * @evidence contracts/common.md#clear-and-simple-design DOM and optional face-default authority are borrowed while complete-document transaction, status and refusal stay with the panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted authored eye fields use registered owner defaults rather than guessed geometry, and callback completion does not certify an accepted history commit.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies optional default provenance, current draft composition, shared intent and separate numerical/admission ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The properties declare no eye construction, DOM rendering or document admission algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current draft and transaction hooks define no numerical cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed DOM and face basis references acquire no listeners, numerical tasks or renderer handles in this type.
 *
 * @author Samchon
 */
export interface IConnectedPersonEyeControlsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are rendered into. */
  container: HTMLElement;

  /** Registered face owner used to preserve its omitted tissue defaults when editing one member. */
  faceBasis?: IAutoMovieHumanFaceBasis;

  /**
   * Read the latest complete person draft when composing an eye edit, including pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Event-time complete draft access preserves newer body and face edits while changing one eye field.
   * @evidence contracts/common.md#clear-and-simple-design Eye controls borrow draft observation while the panel retains mutable draft and history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A painted eye snapshot is not replayed over unrelated pending fields.
   * @evidence contracts/common.md#meaningful-documentation The member explains current complete draft access and pending-field preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The getter signature chooses no draft representation or copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft observation declares no reusable numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned data remains panel-owned and this getter acquires no task or handle.
   */
  current: () => IAutoMovieHumanPersonDocument;

  /**
   * Reserve a whole-person action ticket before its asynchronous transaction.
   *
   * @evidence contracts/common.md#principled-implementation Eye actions reserve the same intent sequence as body, face and history edits before awaiting work.
   * @evidence contracts/common.md#clear-and-simple-design The panel exposes reservation without giving eye controls a competing mutable gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal eye values do not authorize reuse of an older action ticket.
   * @evidence contracts/common.md#meaningful-documentation The callback names whole-person authority and pre-await reservation timing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The reservation type implements no counter or exhaustion strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New authored intent is an effect rather than cached numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ticket issuance acquires no worker or prepared frame.
   */
  reserve: () => number;

  /**
   * Whether this whole-person ticket still authorizes completion status and reports.
   *
   * @evidence contracts/common.md#principled-implementation Current intent suppresses late eye completion and refusal after newer person actions.
   * @evidence contracts/common.md#clear-and-simple-design The predicate borrows panel authority without exposing its internal gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching eye fields do not establish that no later body or history intent exists.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person completion and reporting authorization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The predicate signature chooses no intent comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authority validity is distinct from numerical result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observing a ticket acquires no independent running task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Submit a complete person candidate under the reserved ticket. True means current publication of either an accepted person or a labelled construction draft; panel state identifies accepted history. False includes closed, superseded, refused or failed settlement and does not prove that no earlier publication occurred.
   *
   * @evidence contracts/common.md#principled-implementation Eye changes pass through complete person admission and panel history authority under their shared ticket.
   * @evidence contracts/common.md#clear-and-simple-design One candidate handoff leaves numerical construction, display and accepted history with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid eye field cannot bypass body/face admission or declare false completion an accepted commit.
   * @evidence contracts/common.md#meaningful-documentation The member specifies complete document input, explicit ticket and refusal or supersession outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no construction, history or frame publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct authored transactions are not merged by equal-looking eye fields.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frame retention and stale candidate retirement remain transaction-owned.
   */
  change: (
    document: IAutoMovieHumanPersonDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Show requested eye work separately from its admission outcome.
   *
   * @evidence contracts/common.md#principled-implementation Busy text describes the requested eye transaction before its terminal outcome.
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
   * @evidence contracts/common.md#principled-implementation Eye consumers report only after true completion while their ticket remains current.
   * @evidence contracts/common.md#clear-and-simple-design The section composes the line and the panel retains report presentation and history state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts False or superseded completions do not append this report; a true labelled construction draft retains its refusal qualification and is not promoted to accepted history by reporting.
   * @evidence contracts/common.md#meaningful-documentation The member requires current true publication and leaves accepted-versus-construction-draft classification with the panel.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback selects no string accumulation or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reports are authored presentation effects without numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained report text belongs to the panel rather than this signature.
   */
  report: (text: string) => void;

  /**
   * Report invalid eye input or current transaction refusal while preserving the last-valid person.
   *
   * @evidence contracts/common.md#principled-implementation The parent refusal owner coordinates eye input validation with person draft and displayed state recovery.
   * @evidence contracts/common.md#clear-and-simple-design Eye controls supply the cause while the panel owns last-valid state and refusal presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid geometric combinations receive no guessed accepted replacement values.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input and transaction refusal with last-valid person preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal type selects no recovery or DOM algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current refusal reporting does not share a numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending numerical and frame retirement remain the transaction owner's responsibility.
   */
  refuse: (error: unknown) => void;
}
