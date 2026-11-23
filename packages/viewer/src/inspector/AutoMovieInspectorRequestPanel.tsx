import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";

import {
  type CSSProperties,
  type ChangeEvent,
  type Dispatch,
  type JSX,
  type SetStateAction,
  useState,
} from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import { formatAutoMovieInspectorAddress } from "./formatAutoMovieInspectorAddress.js";
import { formatAutoMovieInspectorCommand } from "./formatAutoMovieInspectorCommand.js";

/**
 * The request as text: the address query, editable, and the `automovie capture` command that repeats the picture, each with a button named for what it copies.
 *
 * The query field shows the request's address text; an edit is dispatched as a `text` action when the field is left or Enter is pressed, and a text the grammar refuses keeps the previous request with the refusal shown above. The command is read-only, quoted for a POSIX shell. Copying writes the field's text to the clipboard where the page may, and says so under the fields, in a status region that stays mounted so each note is announced; where the page has no clipboard, as outside a secure context, or is refused it, the note says to select the text and copy it instead.
 */
export function AutoMovieInspectorRequestPanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** Where an edited text goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const [typed, setTyped] = useState<string | null>(null);
  const [copied, setCopied]: [
    string | null,
    Dispatch<SetStateAction<string | null>>,
  ] = useState<string | null>(null);
  const commit: () => void = (): void => {
    if (typed === null) return;
    setTyped(null);
    props.dispatch({ type: "text", text: typed });
  };
  // A page outside a secure context has no clipboard, and a page may be
  // refused it; either is reported with what to do instead.
  const copy: (name: string, text: string) => Promise<void> = async (
    name: string,
    text: string,
  ): Promise<void> => {
    const refused: string = `Select the ${name} and copy it.`;
    const clipboard: Clipboard | undefined = (
      navigator as Navigator & { clipboard?: Clipboard }
    ).clipboard;
    if (clipboard === undefined) {
      setCopied(refused);
      return;
    }
    try {
      await clipboard.writeText(text);
      setCopied(`The ${name} was copied.`);
    } catch {
      setCopied(refused);
    }
  };
  const address: string =
    typed ?? formatAutoMovieInspectorAddress(props.request);
  const command: string = formatAutoMovieInspectorCommand(props.request).text;
  const row: CSSProperties = {
    display: "flex",
    gap: 4,
    alignItems: "center",
  };
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6 }}>
        Address
        <span style={row}>
          <input
            aria-label="Request address"
            style={{ flex: "1 1 auto", minWidth: 0, fontFamily: "monospace" }}
            value={address}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              setTyped(event.target.value)
            }
            onBlur={commit}
            onKeyDown={(event: { key: string }): void => {
              if (event.key === "Enter") commit();
            }}
          />
          <button
            type="button"
            onClick={(): void => void copy("address", address)}
          >
            Copy address
          </button>
        </span>
      </label>
      <label style={{ display: "block" }}>
        Capture command
        <span style={row}>
          <input
            aria-label="Capture command"
            readOnly
            style={{ flex: "1 1 auto", minWidth: 0, fontFamily: "monospace" }}
            value={command}
          />
          <button
            type="button"
            onClick={(): void => void copy("command", command)}
          >
            Copy command
          </button>
        </span>
      </label>
      {/* The live region stays mounted and only its text changes, so each
          copy's note is announced. */}
      <p role="status" style={{ margin: "4px 0 0", fontSize: 12 }}>
        {copied ?? ""}
      </p>
    </div>
  );
}
