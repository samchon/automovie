import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";
import type { IConnectedPersonSessionState } from "./IConnectedPersonSessionState";

/**
 * The transitions of the person editor's session state. The panel decides which intent is current; only the current intent calls these. The implementation owns presentation state, not ticket validation or frame retirement. Snapshots copy the state and notes array but borrow the draft object; begin clears old notes/refusal, and refuse/rest preserve the displayed draft.
 *
 * @evidence contracts/common.md#principled-implementation Explicit begin/settle/refuse/rest transitions describe pending and displayed draft state separately from accepted editor history, under caller-authorized current intent.
 * @evidence contracts/common.md#clear-and-simple-design The session exposes presentation state transitions while the panel owns intent and the transactional editor/viewport own accepted history and frame lifetimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Settling a refused construction labels it as a draft, refusal does not discard its prior display, and the interface promises no internal ticket check or physical disposal.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies caller authorization, transition preservation/clearing and snapshot borrowing rather than deep model cloning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface chooses no state-copy, transition or rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Session effects define no cached numerical or geometry result identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no frame or task; its implementing session retains notes and borrowed draft data until reset or enclosing panel release.
 *
 * @author Samchon
 */
export interface IConnectedPersonSession<Model> {
  /**
   * Return a shallow state copy with an independently copied notes array and a borrowed draft reference.
   *
   * @evidence contracts/common.md#principled-implementation Snapshot preserves pending/refusal/draft values while note-array copying prevents caller array edits from changing session notes.
   * @evidence contracts/common.md#clear-and-simple-design One observation method exposes presentation state without transferring mutable internal note storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The snapshot is not documented as a deep clone of candidate documents or viewport models.
   * @evidence contracts/common.md#meaningful-documentation The member explicitly distinguishes shallow state copying, independent notes and borrowed draft object.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature declares snapshot shape without selecting the copying implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An observed state copy is not reusable numerical evaluation output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned ordinary data acquires no frame lifetime or native handle.
   */
  snapshot(): IConnectedPersonSessionState<Model>;

  /**
   * Start caller-authorized pending work, clearing refusal and notes while preserving the currently displayed draft.
   *
   * @evidence contracts/common.md#principled-implementation New pending text replaces old status and invalidates prior notes/refusal without pretending the displayed draft changed.
   * @evidence contracts/common.md#clear-and-simple-design This transition updates presentation state while the panel reserves and checks the actual action ticket.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Starting work neither admits a document nor removes the last displayed model.
   * @evidence contracts/common.md#meaningful-documentation The member explains caller authorization, cleared messages and preserved draft display.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration selects no pending-message storage or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Beginning an authored action is a state effect rather than reusable computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No numerical or GPU task is acquired by this state transition signature.
   */
  begin(waiting: string): void;

  /**
   * Settle displayed publication as a labelled construction draft or null for an accepted person, clearing pending/refusal and preserving notes.
   *
   * @evidence contracts/common.md#principled-implementation Publication outcome explicitly distinguishes refused construction display from accepted history and ends the current pending status.
   * @evidence contracts/common.md#clear-and-simple-design The session records draft presentation while the panel publishes the actual frame and the editor retains accepted history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-null draft never becomes an accepted person merely because it is visible or the transition completed.
   * @evidence contracts/common.md#meaningful-documentation The member names draft versus accepted outcomes, cleared pending/refusal and retained notes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no publication or state-update implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Settled display state is an effect without numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Draft data are borrowed; physical frame retirement remains the viewport owner rather than this method.
   */
  settle(draft: IConnectedPersonDraft<Model> | null): void;

  /**
   * Record a current refusal and clear pending work while preserving the previously displayed draft and notes.
   *
   * @evidence contracts/common.md#principled-implementation A refused request carries its cause without replacing the display with an invented successful candidate.
   * @evidence contracts/common.md#clear-and-simple-design The transition records status while panel recovery and frame retention stay with their existing owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal is not a silent rollback of accepted history or a fabricated replacement model.
   * @evidence contracts/common.md#meaningful-documentation The member specifies pending clearing and preserved draft/notes rather than indiscriminate state reset.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type implements no refusal formatting or model recovery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refusal publication is an authored outcome rather than cached numerical success.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This state operation acquires no handle and does not physically retire the preserved draft.
   */
  refuse(reason: string): void;

  /**
   * Clear pending work without changing refusal, notes or the displayed draft.
   *
   * @evidence contracts/common.md#principled-implementation Terminal no-change work ends pending status while preserving the display and existing messages.
   * @evidence contracts/common.md#clear-and-simple-design One narrow transition avoids mixing no-change settlement with new admission or refusal ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest does not manufacture successful admission or erase the prior refusal.
   * @evidence contracts/common.md#meaningful-documentation The member identifies exactly which state field clears and which fields remain.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration chooses no state-update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ending pending status is an effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature allocates no task and leaves physical resource ownership unchanged.
   */
  rest(): void;

  /**
   * Append a caller-authorized current reading or report; notes have no independent cap and the next begin clears them.
   *
   * @evidence contracts/common.md#principled-implementation Reports join current session notes while the caller checks the intent that authorizes their publication.
   * @evidence contracts/common.md#clear-and-simple-design Session note storage remains separate from numerical reading production and DOM presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A note supplies no internal intent check, numerical validation or accepted-history verdict.
   * @evidence contracts/common.md#meaningful-documentation The member identifies caller authority, report retention and clearing at the next begin.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type chooses no note accumulation or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Appending reports is an observation effect without cached geometry identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Note data are ordinary session-owned text and acquire no native resources or running tasks.
   */
  note(text: string): void;
}
