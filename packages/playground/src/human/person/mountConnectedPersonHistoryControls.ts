import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";

import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonSession } from "./IConnectedPersonSession";

/**
 * Bind the person's history and discard commands to one current intent. The history owner publishes synchronously; handlers refresh settled state and then await retirement. A retirement failure reports the displayed pair without undoing an earlier history commit. Stale commands cannot update status.
 *
 * @evidence contracts/common.md#principled-implementation The panel reserves a ticket before each asynchronous history command and checks that ticket before changing session/status; actual history publication remains the editor's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design Four existing buttons delegate undo/redo/reset/restore to one history owner and use the same refresh and retirement seams as ordinary edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither stale completion nor retirement failure is treated as permission to rewind a successful publication; absent history and absent discard drafts return without manufacturing a result.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes synchronous publication, awaited retirement and current-intent status authority.
 * @evidence contracts/performance.md#efficient-algorithms Binding four controls is constant work; each command's document/frame construction and retirement cost belongs to the invoked history and viewport owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work History commands are ordered effects and cannot share a completion merely because their documents match; this adapter keeps no numerical cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Four handlers retain the panel callbacks until its DOM is discarded. This adapter has no close or active-command cap: repeated clicks can leave multiple pending commands, whose stale status is guarded and whose actual work/retirement belongs to the editor and viewport.
 *
 * @author Samchon
 */
export function mountConnectedPersonHistoryControls<
  Model extends IConnectedPersonModel,
>(props: {
  /** Existing editor DOM; the four command buttons belong to this panel. */
  app: HTMLElement;

  /** Current accepted history, absent until an accepted construction arrives. */
  history: () =>
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
      >
    | undefined;

  /** Displayed draft and status owner shared with the ordinary editing transaction. */
  session: IConnectedPersonSession<Model>;

  /** Withdraw pending work and reserve this command's actual publication intent. */
  withdraw: () => number;

  /** The existing panel's intent authority; no elapsed-time rule is introduced. */
  isCurrent: (ticket: number) => boolean;

  /** Publish the command's actual pending status. */
  busy: (text: string) => void;

  /** Draw the session and accepted history that the operation actually left. */
  refresh: () => void;

  /** Report a current command's failure without replacing the displayed model. */
  refuse: (error: unknown) => void;

  /** Complete requested retirement after synchronous history publication. */
  settleRetirements: () => Promise<void>;
}): void {
  const button: (id: string) => HTMLButtonElement = (
    id: string,
  ): HTMLButtonElement => props.app.querySelector<HTMLButtonElement>("#" + id)!;
  for (const action of ["undo", "redo", "reset"] as const)
    button("person-" + action).onclick = async (): Promise<void> => {
      const history:
        | ReturnType<
            typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
          >
        | undefined = props.history();
      if (history === undefined) return;
      const ticket: number = props.withdraw();
      props.busy("Restoring the selected person…");
      try {
        const success: boolean = await history[action]();
        if (props.isCurrent(ticket)) {
          const restored: ReturnType<typeof history.snapshot> =
            history.snapshot();
          if (!success) {
            if (restored.error !== null) props.session.refuse(restored.error);
            else props.session.rest();
          }
          props.refresh();
        }
        await props.settleRetirements();
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
  button("person-discard").onclick = async (): Promise<void> => {
    const history:
      | ReturnType<
          typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
        >
      | undefined = props.history();
    if (history === undefined || props.session.snapshot().draft === null)
      return;
    const ticket: number = props.withdraw();
    props.busy("Returning to the accepted person…");
    try {
      const success: boolean = await history.restore();
      if (props.isCurrent(ticket)) {
        const restored: ReturnType<typeof history.snapshot> =
          history.snapshot();
        if (!success) {
          if (restored.error !== null) props.session.refuse(restored.error);
          else props.session.rest();
        }
        props.refresh();
      }
      await props.settleRetirements();
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
}
