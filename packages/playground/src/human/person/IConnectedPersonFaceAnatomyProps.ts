import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

import type { IConnectedPersonFaceSolution } from "./IConnectedPersonFaceSolution";

/**
 * What the face anatomy panel renders into and calls: the container, the current person, the worker's face reading and solve, and the panel's intent tickets, transaction, status and refusal owners. Readings are worker evaluations of the complete person, retaining registry units, qualifications and named unavailable outcomes. Solves return a candidate document; current whole-person admission separately decides its display and history state.
 *
 * @evidence contracts/common.md#principled-implementation Registered face readings and target inverses evaluate complete person context while shared intent tickets authorize later candidate submission and status effects.
 * @evidence contracts/common.md#clear-and-simple-design The anatomy section borrows draft and numerical operations; worker construction and panel transaction/history remain their distinct owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing anatomical support remains unavailable by name, targets retain registry units and numerical completion alone cannot establish an accepted history commit.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies whole-person reading provenance, units, qualifications, candidate output and separate current admission authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface implements no registered measurement traversal, inverse or whole-person construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The supplied operations declare no cached result identity across different person documents or targets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed DOM and callbacks acquire no worker request, listener or prepared GPU frame in this declaration.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceAnatomyProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are rendered into. */
  container: HTMLElement;

  /**
   * Read the latest complete person draft when composing a face anatomy edit, including pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Event-time complete draft access preserves newer body and face edits while changing one anatomical request field.
   * @evidence contracts/common.md#clear-and-simple-design Face anatomy controls borrow draft observation while the panel retains mutable draft and history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A painted anatomical reading snapshot is not replayed over unrelated pending fields.
   * @evidence contracts/common.md#meaningful-documentation The member explains current complete draft access and pending-field preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The getter signature chooses no draft representation or copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft observation declares no reusable numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned data remains panel-owned and this getter acquires no task or handle.
   */
  current: () => IAutoMovieHumanPersonDocument;

  /**
   * Reserve a whole-person action ticket before its asynchronous transaction.
   *
   * @evidence contracts/common.md#principled-implementation Face anatomy actions reserve the same intent sequence as body, face and history edits before awaiting work.
   * @evidence contracts/common.md#clear-and-simple-design The panel exposes reservation without giving face anatomy controls a competing mutable gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal anatomical target values do not authorize reuse of an older action ticket.
   * @evidence contracts/common.md#meaningful-documentation The callback names whole-person authority and pre-await reservation timing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The reservation type implements no counter or exhaustion strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New authored intent is an effect rather than cached numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ticket issuance acquires no worker or prepared frame.
   */
  reserve: () => number;

  /**
   * Whether this whole-person ticket still authorizes completion status and reports.
   *
   * @evidence contracts/common.md#principled-implementation Current intent suppresses late face anatomy completion and refusal after newer person actions.
   * @evidence contracts/common.md#clear-and-simple-design The predicate borrows panel authority without exposing its internal gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching anatomical request fields do not establish that no later body or history intent exists.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person completion and reporting authorization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The predicate signature chooses no intent comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authority validity is distinct from numerical result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observing a ticket acquires no independent running task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Read registered face measurements on the complete person's final construction, including qualified and named unavailable outcomes.
   *
   * @evidence contracts/common.md#principled-implementation Readings bind the supplied complete person context to registered measurement rules and their original units and qualifications.
   * @evidence contracts/common.md#clear-and-simple-design One numerical hook returns records while section formatting and panel admission remain outside it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing landmarks or acquisition rules return unavailable readings rather than inferred measurements from names.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies final complete-person provenance and preserves qualified or unavailable outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no generation compilation, construction or measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no equivalence or reuse of readings across person documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending reads and resident evaluator retention belong to the supplied transport and worker.
   */
  read: (
    document: IAutoMovieHumanPersonDocument,
  ) => Promise<AutoMovieHumanFaceMeasurementReading[]>;

  /**
   * Solve one registered target in its declared unit, returning a complete candidate with the solved channel, recorded target and final-person readings.
   *
   * @evidence contracts/common.md#principled-implementation The inverse varies registry-listed channels against complete person evaluations and records the requested target in its returned document.
   * @evidence contracts/common.md#clear-and-simple-design Numerical candidate production remains separate from current-ticket person transaction and history publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown measurements and unsupported reads are refused without guessing channels, units or accepted editor state.
   * @evidence contracts/common.md#meaningful-documentation The member identifies registry units, solved channel, target record, candidate context and returned reading provenance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no bracketing, numerical read or construction strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A target solve declares no cached inverse across distinct full documents and target values.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resident evaluator ownership and pending solver settlement belong to the supplied numerical runtime.
   */
  solve: (
    document: IAutoMovieHumanPersonDocument,
    measurement: string,
    target: number,
  ) => Promise<IConnectedPersonFaceSolution>;

  /**
   * Submit a complete person candidate under the reserved ticket. True means current publication of either an accepted person or a labelled construction draft; panel state identifies accepted history. False includes closed, superseded, refused or failed settlement and does not prove that no earlier publication occurred.
   *
   * @evidence contracts/common.md#principled-implementation Face anatomy changes pass through complete person admission and panel history authority under their shared ticket.
   * @evidence contracts/common.md#clear-and-simple-design One candidate handoff leaves numerical construction, display and accepted history with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid anatomical request field cannot bypass body/face admission or declare false completion an accepted commit.
   * @evidence contracts/common.md#meaningful-documentation The member specifies complete document input, explicit ticket and refusal or supersession outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no construction, history or frame publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct authored transactions are not merged by equal-looking anatomical request fields.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frame retention and stale candidate retirement remain transaction-owned.
   */
  change: (
    document: IAutoMovieHumanPersonDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Show requested face anatomy work separately from its admission outcome.
   *
   * @evidence contracts/common.md#principled-implementation Busy text describes the requested face anatomy transaction before its terminal outcome.
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
   * @evidence contracts/common.md#principled-implementation Face anatomy consumers report only after true completion while their ticket remains current.
   * @evidence contracts/common.md#clear-and-simple-design The section composes the line and the panel retains report presentation and history state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale or refused face anatomy transactions do not receive a successful report.
   * @evidence contracts/common.md#meaningful-documentation The member names current successful completion as the report precondition.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback selects no string accumulation or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reports are authored presentation effects without numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained report text belongs to the panel rather than this signature.
   */
  report: (text: string) => void;

  /**
   * Report invalid face anatomy input or current transaction refusal while preserving the last-valid person.
   *
   * @evidence contracts/common.md#principled-implementation The parent refusal owner coordinates face anatomy input validation with person draft and displayed state recovery.
   * @evidence contracts/common.md#clear-and-simple-design Face anatomy controls supply the cause while the panel owns last-valid state and refusal presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid geometric combinations receive no guessed accepted replacement values.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input and transaction refusal with last-valid person preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal type selects no recovery or DOM algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current refusal reporting does not share a numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending numerical and frame retirement remain the transaction owner's responsibility.
   */
  refuse: (error: unknown) => void;
}
