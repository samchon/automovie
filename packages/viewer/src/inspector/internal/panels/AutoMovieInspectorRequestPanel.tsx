import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import {
  type CSSProperties,
  type ChangeEvent,
  type Dispatch,
  type JSX,
  type SetStateAction,
  useState,
} from "react";

import type { IAutoMovieInspectorAction } from "../../IAutoMovieInspectorAction.js";
import type { IAutoMovieInspectorProps } from "../../IAutoMovieInspectorProps.js";
import { AutoMovieViewerInspector } from "../../AutoMovieViewerInspector.js";


/**
 * Copy or edit the address and, when the host supplies a command, copy its
 * capture command in the selected shell syntax.
 *
 * The query field dispatches edits on blur or Enter. A refused edit keeps the
 * previous request. The command is read-only and initially uses POSIX syntax.
 * Copying reports success in a live status region, or tells the reader to
 * select the text if clipboard access is unavailable.
 */
export function AutoMovieInspectorRequestPanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** Where an edited text goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;

  /** Executable and fixed arguments from the host for the optional command. */
  captureCommand?: IAutoMovieInspectorProps["captureCommand"];
}): JSX.Element {
  const [typed, setTyped] = useState<string | null>(null);
  const [shell, setShell] = useState<"posix" | "powershell">("posix");
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
    typed ?? AutoMovieViewerInspector.formatAddress(props.request);
  const command: string | null = props.captureCommand
    ? AutoMovieViewerInspector.formatCommand(props.request, {
        command: props.captureCommand,
        shell,
      }).text
    : null;
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
      {command !== null && (
        <>
          <label style={{ display: "block" }}>
            Shell{" "}
            <select
              aria-label="Command shell"
              value={shell}
              onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                setShell(
                  event.target.value === "powershell" ? "powershell" : "posix",
                )
              }
            >
              <option value="posix">POSIX</option>
              <option value="powershell">PowerShell 7.3+</option>
            </select>
          </label>
          <label style={{ display: "block" }}>
            Capture command
            <span style={row}>
              <input
                aria-label="Capture command"
                readOnly
                style={{
                  flex: "1 1 auto",
                  minWidth: 0,
                  fontFamily: "monospace",
                }}
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
        </>
      )}
      {/* The live region stays mounted and only its text changes, so each
          copy's note is announced. */}
      <p role="status" style={{ margin: "4px 0 0", fontSize: 12 }}>
        {copied ?? ""}
      </p>
    </div>
  );
}
