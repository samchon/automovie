import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IConnectedPersonHeadSolution } from "@automovie/human/human/runtime/IConnectedPersonHeadSolution";

/**
 * What the head measurement controls render into and call: the container, the current person, the panel's intent tickets, the off-thread reader and solver, and the panel's transaction, status and refusal owners. Readers evaluate complete-person skin at rest in metres and the section assembly refuses reads on a construction draft. Solves produce a complete candidate and reporting values; the shared current transaction separately decides publication and history. Required and optional secondary targets retain their numerical owner's distinct acceptance rules.
 *
 * @evidence contracts/common.md#principled-implementation Head targets use registered rest-skin rules and one complete-person numerical evaluator while shared intent authority governs candidate submission and reporting.
 * @evidence contracts/common.md#clear-and-simple-design This section borrows current draft, numerical reads/solves and panel hooks; it owns neither compiled geometry nor a second history transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction drafts receive no admitted measurement read, optional secondary pursuit is not reported as guaranteed met, and numerical solver completion cannot establish clinical or editor validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies complete-person rest state, metre units, draft-read refusal, candidate/admission separation and primary-versus-secondary target authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema implements no rest-skin read, bounded head solve or section rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current draft and solve hooks declare no cached numerical equivalence across complete documents and target sets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed DOM and callbacks acquire no compiled evaluator, worker request or prepared frame in this declaration.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadControlsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are rendered into. */
  container: HTMLElement;

  /**
   * Read the latest complete person draft when composing a head measurement edit, including pending fields.
   *
   * @evidence contracts/common.md#principled-implementation Event-time complete draft access preserves newer body and face edits while changing one head candidate field.
   * @evidence contracts/common.md#clear-and-simple-design Head measurement controls borrow draft observation while the panel retains mutable draft and history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A painted head reading snapshot is not replayed over unrelated pending fields.
   * @evidence contracts/common.md#meaningful-documentation The member explains current complete draft access and pending-field preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The getter signature chooses no draft representation or copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft observation declares no reusable numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned data remains panel-owned and this getter acquires no task or handle.
   */
  current: () => IAutoMovieHumanPersonDocument;

  /**
   * Reserve a whole-person action ticket before its asynchronous transaction.
   *
   * @evidence contracts/common.md#principled-implementation Head measurement actions reserve the same intent sequence as body, face and history edits before awaiting work.
   * @evidence contracts/common.md#clear-and-simple-design The panel exposes reservation without giving head measurement controls a competing mutable gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal head target values do not authorize reuse of an older action ticket.
   * @evidence contracts/common.md#meaningful-documentation The callback names whole-person authority and pre-await reservation timing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The reservation type implements no counter or exhaustion strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New authored intent is an effect rather than cached numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ticket issuance acquires no worker or prepared frame.
   */
  reserve: () => number;

  /**
   * Whether this whole-person ticket still authorizes completion status and reports.
   *
   * @evidence contracts/common.md#principled-implementation Current intent suppresses late head measurement completion and refusal after newer person actions.
   * @evidence contracts/common.md#clear-and-simple-design The predicate borrows panel authority without exposing its internal gate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching head candidate fields do not establish that no later body or history intent exists.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person completion and reporting authorization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The predicate signature chooses no intent comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authority validity is distinct from numerical result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observing a ticket acquires no independent running task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Read registered head measurements on a complete person's final rest skin in metres by name; the actual section owner blocks reads on construction drafts.
   *
   * @evidence contracts/common.md#principled-implementation Numerical readings use complete person context and registered head rules on final skin at rest, with admitted-state access enforced by section assembly.
   * @evidence contracts/common.md#clear-and-simple-design The callback returns named metre readings while section formatting and panel draft authority remain their own consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A draft or unreadable rest skin receives refusal rather than fabricated current measurement values.
   * @evidence contracts/common.md#meaningful-documentation The member specifies final rest-skin provenance, registered names, metre units and the actual draft-read gate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The read signature selects no generation compilation, construction or measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Named readback declares no shared result across distinct person documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending reads and resident generation retention belong to the numerical transport and worker.
   */
  read: (
    document: IAutoMovieHumanPersonDocument,
  ) => Promise<Record<string, number>>;

  /**
   * Solve registered primary and optional secondary head targets in metres, returning the candidate, rest-skin readings and independent-channel departure objective.
   *
   * @evidence contracts/common.md#principled-implementation The numerical owner solves registered channels within source envelopes, rejects unmet required targets and pursues optional secondary targets within remaining freedom.
   * @evidence contracts/common.md#clear-and-simple-design Candidate production and numerical reporting remain separate from the panel's current-intent admission and history publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Secondary miss is not hidden as guaranteed success and the departure proxy is not composed-skin readback or clinical validity.
   * @evidence contracts/common.md#meaningful-documentation The callback distinguishes primary/secondary targets, metre units, final readback and the candidate's separate admission boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback type implements no bounded iteration, endpoint displacement or rest-skin evaluation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct complete-document and target inputs declare no cached solve result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numerical request settlement and compiled evaluator lifetime belong to the resident transport and worker.
   */
  solve: (
    document: IAutoMovieHumanPersonDocument,
    targets: Record<string, number>,
  ) => Promise<IConnectedPersonHeadSolution>;

  /**
   * Submit a complete person candidate under the reserved ticket. True means current publication of either an accepted person or a labelled construction draft; panel state identifies accepted history. False includes closed, superseded, refused or failed settlement and does not prove that no earlier publication occurred.
   *
   * @evidence contracts/common.md#principled-implementation Head measurement changes pass through complete person admission and panel history authority under their shared ticket.
   * @evidence contracts/common.md#clear-and-simple-design One candidate handoff leaves numerical construction, display and accepted history with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid head candidate field cannot bypass body/face admission or declare false completion an accepted commit.
   * @evidence contracts/common.md#meaningful-documentation The member specifies complete document input, explicit ticket and refusal or supersession outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no construction, history or frame publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct authored transactions are not merged by equal-looking head candidate fields.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frame retention and stale candidate retirement remain transaction-owned.
   */
  change: (
    document: IAutoMovieHumanPersonDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Show requested head measurement work separately from its admission outcome.
   *
   * @evidence contracts/common.md#principled-implementation Busy text describes the requested head measurement transaction before its terminal outcome.
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
   * @evidence contracts/common.md#principled-implementation Head measurement consumers report only after true completion while their ticket remains current.
   * @evidence contracts/common.md#clear-and-simple-design The section composes the line and the panel retains report presentation and history state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts False or superseded completions do not append this report; a true labelled construction draft retains its refusal qualification and is not promoted to accepted history by reporting.
   * @evidence contracts/common.md#meaningful-documentation The member requires current true publication and leaves accepted-versus-construction-draft classification with the panel.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback selects no string accumulation or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reports are authored presentation effects without numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained report text belongs to the panel rather than this signature.
   */
  report: (text: string) => void;

  /**
   * Report invalid head measurement input or current transaction refusal while preserving the last-valid person.
   *
   * @evidence contracts/common.md#principled-implementation The parent refusal owner coordinates head measurement input validation with person draft and displayed state recovery.
   * @evidence contracts/common.md#clear-and-simple-design Head measurement controls supply the cause while the panel owns last-valid state and refusal presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid geometric combinations receive no guessed accepted replacement values.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input and transaction refusal with last-valid person preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal type selects no recovery or DOM algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current refusal reporting does not share a numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending numerical and frame retirement remain the transaction owner's responsibility.
   */
  refuse: (error: unknown) => void;
}
