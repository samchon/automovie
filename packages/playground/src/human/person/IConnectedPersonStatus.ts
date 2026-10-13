/**
 * The status line of the person editor, derived from its session state.
 *
 * @author Samchon
 */
export interface IConnectedPersonStatus {
  /** The lines to display. */
  text: string;

  /** building: an intent is pending. ready: the accepted person is shown. draft: a refused construction is shown. error: the newest intent was refused. empty: nothing has been built. */
  state: "building" | "ready" | "draft" | "error" | "empty";
}
