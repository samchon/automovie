import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";

/**
 * What the person editor is doing and showing, apart from the accepted
 * history the transactional editor owns. Every status line, button state and
 * report on the screen is derived from this record and that history, so no
 * text survives the state it described.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Records the pending intent, the last refusal and the displayed draft from which the editor screen is drawn.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Gives the screen one state to read after a success, a refusal or a superseded request.
 * @author Samchon
 */
export interface IConnectedPersonSessionState<Model> {
  /** What the newest intent is waiting for, or null when nothing is pending. */
  pending: string | null;

  /** Why the newest settled intent changed nothing, or null after a success. */
  refusal: string | null;

  /** Readings the newest intent reported after it settled. */
  notes: string[];

  /** The refused construction on screen, or null when the accepted person or nothing is shown. */
  draft: IConnectedPersonDraft<Model> | null;
}
