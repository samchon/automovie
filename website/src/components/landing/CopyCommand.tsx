"use client";

import { type Dispatch, type ReactElement, type SetStateAction, useState } from "react";

/** What the last copy came to. */
type Outcome = "idle" | "copied" | "refused";

/**
 * A shell command with a button that copies it. The button is named by its
 * visible text and the command, and the outcome is announced through a
 * status region: copied, or, when the browser refuses the clipboard, that the
 * command must be selected by hand.
 *
 * @param props The command.
 * @returns The command line.
 */
export function CopyCommand(props: { command: string }): ReactElement {
  const [outcome, setOutcome]: [Outcome, Dispatch<SetStateAction<Outcome>>] =
    useState<Outcome>("idle");
  const copy: () => void = (): void => {
    navigator.clipboard
      .writeText(props.command)
      .then((): void => setOutcome("copied"))
      .catch((): void => setOutcome("refused"))
      .finally((): void => {
        window.setTimeout((): void => setOutcome("idle"), 2000);
      });
  };
  return (
    <div className="am-command">
      <code>
        <span aria-hidden="true">$ </span>
        {props.command}
      </code>
      <button type="button" onClick={copy}>
        {outcome === "copied" ? "Copied" : "Copy"}
        <span className="am-visually-hidden"> {props.command}</span>
      </button>
      <span className="am-visually-hidden" role="status">
        {outcome === "copied"
          ? "The command was copied."
          : outcome === "refused"
            ? "The browser refused the clipboard; select the command to copy it."
            : ""}
      </span>
    </div>
  );
}
