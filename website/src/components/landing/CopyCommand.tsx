"use client";

import { type ReactElement, useState } from "react";

/**
 * A shell command with a button that copies it.
 *
 * @param props The command.
 * @returns The command line.
 */
export function CopyCommand(props: { command: string }): ReactElement {
  const [copied, setCopied] = useState<boolean>(false);
  return (
    <div className="am-command">
      <code>
        <span aria-hidden="true">$ </span>
        {props.command}
      </code>
      <button
        type="button"
        onClick={(): void => {
          void navigator.clipboard
            .writeText(props.command)
            .then((): void => {
              setCopied(true);
              window.setTimeout((): void => setCopied(false), 1600);
            });
        }}
        aria-label={`Copy ${props.command}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
