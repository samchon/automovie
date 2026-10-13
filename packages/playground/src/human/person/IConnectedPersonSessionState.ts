import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";

/**
 * What the person editor is doing and showing, apart from the accepted
 * history the transactional editor owns. Every status line, button state and
 * report on the screen is derived from this record and that history, so no
 * text survives the state it described.
 *
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
