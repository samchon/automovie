"use client";

import {
  type Dispatch,
  type ReactElement,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

/** What the last copy came to. */
type Outcome = "idle" | "copied" | "refused";

/**
 * A shell command with a button that copies it. The button is named by its
 * visible text and the command, and the outcome is announced through a
 * status region: copied, or, when the browser has no clipboard or refuses
 * it, that the command must be selected by hand. Each outcome shows for two
 * seconds from the latest click.
 *
 * @param props The command.
 * @returns The command line.
 */
export function CopyCommand(props: { command: string }): ReactElement {
  const [outcome, setOutcome]: [Outcome, Dispatch<SetStateAction<Outcome>>] =
    useState<Outcome>("idle");
  const timer: RefObject<number> = useRef<number>(0);
  useEffect((): (() => void) => (): void => window.clearTimeout(timer.current), []);

  const show: (next: Outcome) => void = (next: Outcome): void => {
    setOutcome(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout((): void => setOutcome("idle"), 2000);
  };
  const copy: () => void = (): void => {
    // A page served over plain http has no clipboard at all.
    if (navigator.clipboard === undefined) {
      show("refused");
      return;
    }
    navigator.clipboard
      .writeText(props.command)
      .then((): void => show("copied"))
      .catch((): void => show("refused"));
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
            ? "The browser gave no clipboard; select the command to copy it."
            : ""}
      </span>
    </div>
  );
}
