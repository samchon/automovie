import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * Complete person transactions used by the independent oral numerical editor. The panel owns admission, history and last-valid state; these controls author a candidate and publish it only through that transaction. Current access includes the working draft, and the form keeps authored millimetre dimensions, omitted source presence and requested tongue performance distinct. No clinical population values or hidden-root measurements are supplied by this contract.
 *
 * @evidence contracts/common.md#principled-implementation Oral fields compose with the current complete person draft and pass through the shared intent-bound transaction for numerical admission and history.
 * @evidence contracts/common.md#clear-and-simple-design The oral section borrows DOM and panel callbacks without introducing independent geometry, committed state or history ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted source traits are not rewritten as measured personal presence, requested performance is not clinical capacity and transaction completion is separate from accepted history state.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies working-draft access, shared transaction ownership and distinct authored/source/performance quantities without hidden measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input type selects no oral construction, DOM parsing or person admission algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current state and authored transaction hooks define no numerical cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed DOM and callbacks acquire no worker, scene allocation or control listener in the declaration.
 *
 * @author Samchon
 */
export interface IConnectedPersonOralControlsProps {
  /** Browser document creating the independent oral form elements. */
  dom: Document;

  /** Host into which the controls append their forms. */
  container: HTMLElement;

  /**
   * Read the latest complete person draft when composing an oral edit, including pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Event-time complete draft access preserves newer body and face edits while changing one oral candidate field.
   * @evidence contracts/common.md#clear-and-simple-design Oral controls borrow draft observation while the panel retains mutable draft and history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A painted oral field snapshot is not replayed over unrelated pending fields.
   * @evidence contracts/common.md#meaningful-documentation The member explains current complete draft access and pending-field preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The getter signature chooses no draft representation or copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft observation declares no reusable numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned data remains panel-owned and this getter acquires no task or handle.
   */
  current: () => IAutoMovieHumanPersonDocument;

  /**
   * Reserve a whole-person action ticket before its asynchronous transaction.
   *
   * @evidence contracts/common.md#principled-implementation Oral actions reserve the same intent sequence as body, face and history edits before awaiting work.
   * @evidence contracts/common.md#clear-and-simple-design The panel exposes reservation without giving oral controls a competing mutable gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal oral target values do not authorize reuse of an older action ticket.
   * @evidence contracts/common.md#meaningful-documentation The callback names whole-person authority and pre-await reservation timing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The reservation type implements no counter or exhaustion strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New authored intent is an effect rather than cached numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ticket issuance acquires no worker or prepared frame.
   */
  reserve: () => number;

  /**
   * Whether this whole-person ticket still authorizes completion status and reports.
   *
   * @evidence contracts/common.md#principled-implementation Current intent suppresses late oral completion and refusal after newer person actions.
   * @evidence contracts/common.md#clear-and-simple-design The predicate borrows panel authority without exposing its internal gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching oral candidate fields do not establish that no later body or history intent exists.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person completion and reporting authorization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The predicate signature chooses no intent comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authority validity is distinct from numerical result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observing a ticket acquires no independent running task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Submit a complete person candidate under the reserved ticket. True means current publication of either an accepted person or a labelled construction draft; panel state identifies accepted history. False includes closed, superseded, refused or failed settlement and does not prove that no earlier publication occurred.
   *
   * @evidence contracts/common.md#principled-implementation Oral changes pass through complete person admission and panel history authority under their shared ticket.
   * @evidence contracts/common.md#clear-and-simple-design One candidate handoff leaves numerical construction, display and accepted history with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid oral candidate field cannot bypass body/face admission or declare false completion an accepted commit.
   * @evidence contracts/common.md#meaningful-documentation The member specifies complete document input, explicit ticket and refusal or supersession outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no construction, history or frame publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct authored transactions are not merged by equal-looking oral candidate fields.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frame retention and stale candidate retirement remain transaction-owned.
   */
  change: (
    document: IAutoMovieHumanPersonDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Show requested oral work separately from its admission outcome.
   *
   * @evidence contracts/common.md#principled-implementation Busy text describes the requested oral transaction before its terminal outcome.
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
   * @evidence contracts/common.md#principled-implementation Oral consumers report only after true completion while their ticket remains current.
   * @evidence contracts/common.md#clear-and-simple-design The section composes the line and the panel retains report presentation and history state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale or refused oral transactions do not receive a successful report.
   * @evidence contracts/common.md#meaningful-documentation The member names current successful completion as the report precondition.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback selects no string accumulation or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reports are authored presentation effects without numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained report text belongs to the panel rather than this signature.
   */
  report: (text: string) => void;

  /**
   * Report invalid oral input or current transaction refusal while preserving the last-valid person.
   *
   * @evidence contracts/common.md#principled-implementation The parent refusal owner coordinates oral input validation with person draft and displayed state recovery.
   * @evidence contracts/common.md#clear-and-simple-design Oral controls supply the cause while the panel owns last-valid state and refusal presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid geometric combinations receive no guessed accepted replacement values.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input and transaction refusal with last-valid person preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal type selects no recovery or DOM algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current refusal reporting does not share a numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending numerical and frame retirement remain the transaction owner's responsibility.
   */
  refuse: (error: unknown) => void;
}
