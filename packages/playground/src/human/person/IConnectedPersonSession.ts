import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";
import type { IConnectedPersonSessionState } from "./IConnectedPersonSessionState";

/**
 * The transitions of the person editor's session state. The panel decides
 * which intent is current; only the current intent calls these.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names the editor's state transitions so a refusal keeps what is displayed and a success replaces it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates beginning, settling and refusing an intent from drawing the screen.
 * @author Samchon
 */
export interface IConnectedPersonSession<Model> {
  /** A copy of the current state. */
  snapshot(): IConnectedPersonSessionState<Model>;

  /** A new intent started: it is pending, and the previous refusal and notes no longer describe the screen. */
  begin(waiting: string): void;

  /** The pending intent put a person on screen: a refused construction as a draft, or null for an accepted person. */
  settle(draft: IConnectedPersonDraft<Model> | null): void;

  /** The pending intent changed nothing; what was displayed stays displayed. */
  refuse(reason: string): void;

  /** The pending intent finished without changing or refusing anything. */
  rest(): void;

  /** Add a reading of the settled intent. */
  note(text: string): void;
}
