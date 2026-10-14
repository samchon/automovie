import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

/**
 * What the anatomical target rows render into and call: the container, the body view within its reach, the search, the parent's drafts and intent tickets, and the panel's transaction, status and refusal owners.
 *
 * Targets are edited in millimetres and stored in metres at their anatomical request path. Text drafts remain outside the document until submission; current publication can clear them and report the stated target, while parent state separately identifies accepted history or labelled construction draft.
 *
 * @evidence contracts/common.md#principled-implementation Evaluable basis reach, request-path text drafts and shared intent tickets keep anatomical target authoring separate from the numerical channel binding and committed document.
 * @evidence contracts/common.md#clear-and-simple-design The row renderer receives DOM, draft and transaction seams while the parent owns status, history, publication and numerical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shortened basis remains authoritative for available controls and target text does not become committed geometry before admission.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies request-path storage, millimetre versus metre boundaries, uncommitted text and current-intent admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This mounting schema chooses no target traversal, inverse solver or document rebuild algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The properties supply current state and intent hooks without implementing shared numerical result identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources DOM and drafts are parent-owned references; this type acquires no listener, worker or frame.
 *
 * @author Samchon
 */
export interface IConnectedBodyExteriorTargetsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are appended to. */
  container: HTMLElement;

  /** The body view with each channel's range cut to its evaluable reach. */
  basis: IAutoMovieHumanBodyBasis;

  /** The search text, lower-cased without spaces. */
  query: string;

  /** Uncommitted typed targets by request path, owned by the parent. */
  drafts: Map<string, string>;

  /**
   * Read the latest draft before editing a target so unrelated pending fields survive.
   *
   * @evidence contracts/common.md#principled-implementation Latest draft access supplies the base document for replacing one anatomical request path.
   * @evidence contracts/common.md#clear-and-simple-design The row receives document state without owning the parent's history or pending transaction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Events read the current draft rather than overwriting newer fields with the painted snapshot.
   * @evidence contracts/common.md#meaningful-documentation The member identifies event-time access and preservation of unrelated draft fields.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This getter signature chooses no document copying or lookup algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current state access declares no cache of numerical geometry.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned document is borrowed and this getter acquires no external resource.
   */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /**
   * Reserve a newer body intent before conversion or asynchronous admission.
   *
   * @evidence contracts/common.md#principled-implementation Pre-await ticket reservation represents user action order rather than reply completion order.
   * @evidence contracts/common.md#clear-and-simple-design The parent gate owns identity while the row carries only its reserved ticket.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A new target action does not reuse an older shape-equality or elapsed-time identity.
   * @evidence contracts/common.md#meaningful-documentation The callback specifies ordering before asynchronous admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reservation signature chooses no generation representation or overflow policy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Intent reservation is a distinct user effect rather than reusable numerical computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The scalar ticket carries no worker task or renderer handle.
   */
  reserve: () => number;

  /**
   * Whether a reserved ticket still authorizes status and draft effects.
   *
   * @evidence contracts/common.md#principled-implementation Current intent gates late success and refusal before they change visible status or text drafts.
   * @evidence contracts/common.md#clear-and-simple-design One predicate exposes admission authority without the gate's mutable state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching numerical values alone do not establish current user intent.
   * @evidence contracts/common.md#meaningful-documentation The member identifies authorization of both status and draft effects.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This predicate type implements no ticket comparison algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validity observation coordinates no numerical result sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ticket validity inspection acquires no resource or running task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Submit the edited document under its reserved ticket. True means current publication, including an accepted person or a labelled construction draft in the person consumer. False includes refusal, supersession, closure or failed settlement after earlier publication; it promises no rollback.
   *
   * @evidence contracts/common.md#principled-implementation The Human owner evaluates authored anatomy, while the parent's current ticket authorizes complete-document publication and its own state classifies accepted history versus labelled draft.
   * @evidence contracts/common.md#clear-and-simple-design A boolean asynchronous transaction leaves inverse evaluation, history and publication with the parent.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Submission does not certify acceptance; true publication can remain a labelled construction draft and failed settlement does not imply that no frame was published.
   * @evidence contracts/common.md#meaningful-documentation The callback documents ticket-bound submission and refused or superseded false outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This commit signature chooses no anatomical solver or frame construction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Effectful document admission declares no merging of independent user intents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Frame and request retirement belong to the supplied transaction implementation.
   */
  change: (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Name the target transaction currently building without committing its text draft.
   *
   * @evidence contracts/common.md#principled-implementation Busy telemetry is separate from numerical admission and retained text drafts.
   * @evidence contracts/common.md#clear-and-simple-design The parent owns the status element while rows supply transaction text.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A busy message claims no successful geometry or achieved target.
   * @evidence contracts/common.md#meaningful-documentation The operation comment distinguishes building status from committed state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This status signature implements no rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Status publication is an effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns its status DOM and this callback acquires no handle.
   */
  busy: (text: string) => void;

  /**
   * Append a current stated-target or clearing report after publication; it is not independently achieved readback or accepted history.
   *
   * @evidence contracts/common.md#principled-implementation Reports follow true publication under the current ticket, with requested-target text distinct from independently achieved readback and accepted-history classification.
   * @evidence contracts/common.md#clear-and-simple-design The row supplies one report line while the parent controls status presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stated target report is not independent achieved readback, accepted history or clinical acquisition validity.
   * @evidence contracts/common.md#meaningful-documentation The member locates requested-target or clearing reports after current publication, whose accepted-or-draft classification remains panel state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This report signature selects no string accumulation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Visible report publication is an effect with no numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent owns report text lifetime and no external resource is acquired here.
   */
  report: (text: string) => void;

  /**
   * Report conversion or current transaction refusal while preserving last-valid committed state.
   *
   * @evidence contracts/common.md#principled-implementation Refusal reports invalid finite conversion or builder failure without treating the failed target as committed anatomy.
   * @evidence contracts/common.md#clear-and-simple-design One refusal owner coordinates visible error and parent recovery instead of row-local rollback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed target admission keeps last-valid state rather than substituting a guessed measurement or frame.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies refusal sources and preservation of committed state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal signature chooses no rollback or error formatting algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refusal is a current transaction effect and shares no numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending request retirement and retained preview lifetime remain parent-owned.
   */
  refuse: (error: unknown) => void;
}
