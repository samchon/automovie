/**
 * The status line of the person editor, derived from its session state.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor States whether the screen shows a committed person, a refused draft, a pending build or nothing.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Carries the one derived status the editor screen displays.
 * @author Samchon
 */
export interface IConnectedPersonStatus {
  /** The lines to display. */
  text: string;

  /** building: an intent is pending. ready: the accepted person is shown. draft: a refused construction is shown. error: the newest intent was refused. empty: nothing has been built. */
  state: "building" | "ready" | "draft" | "error" | "empty";
}
