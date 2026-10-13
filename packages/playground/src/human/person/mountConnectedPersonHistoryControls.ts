import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";

import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonSession } from "./IConnectedPersonSession";

/**
 * Bind the person's history and discard commands to one current intent.
 * The history owner publishes synchronously; these outer command handlers
 * refresh its settled state and then await real resource retirement. A
 * cleanup refusal reports the existing displayed pair instead of undoing a
 * successful history commit. A stale command has no authority over status.
 *
 * @author Samchon
 */
export function mountConnectedPersonHistoryControls<
  Model extends IConnectedPersonModel,
>(props: {
  /** Existing editor DOM; the four command buttons belong to this panel. */
  app: HTMLElement;

  /** Current accepted history, absent until an accepted construction arrives. */
  history: () => ReturnType<
    typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
  > | undefined;

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
}) {
  const button = (id: string) =>
    props.app.querySelector<HTMLButtonElement>("#" + id)!;
  for (const action of ["undo", "redo", "reset"] as const)
    button("person-" + action).onclick = async () => {
      const history = props.history();
      if (history === undefined) return;
      const ticket = props.withdraw();
      props.busy("Restoring the selected person…");
      try {
        const success = await history[action]();
        if (props.isCurrent(ticket)) {
          const restored = history.snapshot();
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
  button("person-discard").onclick = async () => {
    const history = props.history();
    if (history === undefined || props.session.snapshot().draft === null) return;
    const ticket = props.withdraw();
    props.busy("Returning to the accepted person…");
    try {
      const success = await history.restore();
      if (props.isCurrent(ticket)) {
        const restored = history.snapshot();
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
