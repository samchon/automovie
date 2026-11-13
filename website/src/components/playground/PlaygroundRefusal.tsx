"use client";

import type { ReactElement } from "react";

import type { IPlaygroundRefusal } from "../../playground/structures/IPlaygroundRefusal";

/**
 * Why the composition was not performed, where the performance would be.
 *
 * The package's message is shown as it was thrown, with the refusal's
 * fields under it. The same refusal is marked in the editor on the action
 * it names, where its accepted values can be applied.
 *
 * @param props The refusal.
 * @returns The readout.
 */
export function PlaygroundRefusal(props: {
  /** The refusal. */
  refusal: IPlaygroundRefusal;

  /** Whether the editor marks the action the refusal names. */
  located: boolean;
}): ReactElement {
  const { refusal } = props;
  const place: string =
    refusal.performer === "" && refusal.act === ""
      ? ""
      : `${refusal.performer}${refusal.performer !== "" && refusal.act !== "" ? "." : ""}${refusal.act}${refusal.instance === 0 ? "" : `#${refusal.instance}`}`;
  return (
    <section className="am-alert" role="alert" aria-labelledby="am-refusal">
      <h2 id="am-refusal">
        {refusal.kind === "error" ? "Not performed" : "Refused"}
      </h2>
      <pre className="am-message">{refusal.message}</pre>
      {refusal.kind === "error" ? null : (
        <dl className="am-facts">
          <dt>Kind</dt>
          <dd>{refusal.kind}</dd>
          {place === "" ? null : (
            <>
              <dt>Where</dt>
              <dd className="am-mono">{place}</dd>
            </>
          )}
          <dt>Axis</dt>
          <dd className="am-mono">{refusal.axis}</dd>
          <dt>Value</dt>
          <dd className="am-mono">
            {JSON.stringify(refusal.value) ?? "undefined"}
          </dd>
          {refusal.feasible === null ? null : (
            <>
              <dt>Feasible</dt>
              <dd>{refusal.feasible}</dd>
            </>
          )}
          <dt>Fix</dt>
          <dd>{refusal.fix}</dd>
        </dl>
      )}
      {props.located ? (
        <p className="am-muted">
          The action it names is marked in the composition.
        </p>
      ) : null}
    </section>
  );
}
