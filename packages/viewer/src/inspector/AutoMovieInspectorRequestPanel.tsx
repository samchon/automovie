import type { IAutoMovieCapturePlanRequest } from "@automovie/render";
import { type ChangeEvent, type JSX, useState } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import { formatAutoMovieInspectorAddress } from "./formatAutoMovieInspectorAddress.js";
import { formatAutoMovieInspectorCommand } from "./formatAutoMovieInspectorCommand.js";

/**
 * The request as text: the address query, editable, and the `automovie capture` command that repeats the picture.
 *
 * The query field shows the request's address text; an edit is dispatched as a `text` action when the field is left or Enter is pressed, and a text the grammar refuses keeps the previous request with the refusal shown above. The command is read-only, quoted for a POSIX shell.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each field shows, when an edit is dispatched, the refusal and the command's quoting.
 * @evidence contracts/development/implementation.md#principled-implementation Both texts are written from the request by the grammar's writers, so the address, the command and the picture name one request.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One editable field and one read-only field.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The typed text is held only until it is dispatched; the request stays the reducer's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two writes of the request per render, linear in its text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view with handlers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds only the text being typed.
 */
export function AutoMovieInspectorRequestPanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** Where an edited text goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const [typed, setTyped] = useState<string | null>(null);
  const commit: () => void = (): void => {
    if (typed === null) return;
    setTyped(null);
    props.dispatch({ type: "text", text: typed });
  };
  return (
    <fieldset>
      <legend>Request</legend>
      <label style={{ display: "block" }}>
        address{" "}
        <input
          aria-label="Request address"
          style={{ width: "100%", fontFamily: "monospace" }}
          value={typed ?? formatAutoMovieInspectorAddress(props.request)}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            setTyped(event.target.value)
          }
          onBlur={commit}
          onKeyDown={(event: { key: string }): void => {
            if (event.key === "Enter") commit();
          }}
        />
      </label>
      <label style={{ display: "block" }}>
        command{" "}
        <input
          aria-label="Capture command"
          readOnly
          style={{ width: "100%", fontFamily: "monospace" }}
          value={formatAutoMovieInspectorCommand(props.request).text}
        />
      </label>
    </fieldset>
  );
}
