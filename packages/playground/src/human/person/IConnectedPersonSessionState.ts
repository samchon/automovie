import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";

/**
 * What the person editor is doing and showing, apart from the accepted history the transactional editor owns. Every status line, button state and report on the screen is derived from this record and that history. A new intent clears refusal and notes; settle clears pending/refusal and replaces the displayed draft, while refuse/rest preserve the previous displayed draft and notes. The record does not carry intent identity: the panel must authorize each transition. Notes have no independent count cap and are cleared at the next begin; snapshots copy their array while borrowing the displayed draft object.
 *
 * @evidence contracts/common.md#principled-implementation Pending text, refusal, settled readings and displayed draft describe session state separately from the transactional editor's accepted history.
 * @evidence contracts/common.md#clear-and-simple-design The state record holds presentation/session data while the panel controls current intent and the editor owns accepted document/frame history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A displayed refused construction is explicitly a draft, and this record does not invent intent validation or equate settled publication with accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies transition preservation/clearing, caller intent authorization, note retention and snapshot draft borrowing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The data interface implements no transition, snapshot-copy or display rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Session state represents authored intent effects rather than reusable numerical results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no GPU resource or task; note/draft reachability belongs to its session owner and enclosing panel lifetime.
 *
 * @author Samchon
 */
export interface IConnectedPersonSessionState<Model> {
  /** What the newest intent is waiting for, or null when nothing is pending. */
  pending: string | null;

  /** Current refusal cause, including failed settlement after publication; null after success. */
  refusal: string | null;

  /** Readings the newest intent reported after it settled. */
  notes: string[];

  /** The refused construction on screen, or null when the accepted person or nothing is shown. */
  draft: IConnectedPersonDraft<Model> | null;
}
