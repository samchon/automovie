"use client";

import type { ReactElement } from "react";

import type { IPlaygroundVerdicts } from "../../playground/structures/IPlaygroundVerdicts";

/**
 * The verdict report of the drawn performance: the physical bounds it
 * breaks, each on its performer, action and film second.
 *
 * Reading the report samples the whole film, so it runs only when asked.
 *
 * @param props The report's state and what starts a reading.
 * @returns The readout.
 */
export function PlaygroundVerdicts(props: {
  /** Nothing read yet, a reading under way, the report, or why the reading failed. */
  state: PlaygroundVerdicts.State;

  /** Start a reading. */
  onRead: () => void;
}): ReactElement {
  const { state } = props;
  return (
    <section
      className="am-panel am-stack"
      aria-labelledby="am-verdicts"
      aria-live="polite"
      aria-busy={state.kind === "reading"}
    >
      <h2 id="am-verdicts">Verdicts</h2>
      {state.kind === "idle" ? (
        <>
          <p className="am-muted">
            The physical bounds every human motion keeps: no part through
            another, no foot skating, every joint in its range. Reading them
            samples the whole film and can take a minute or more.
          </p>
          <button type="button" onClick={props.onRead}>
            Read the verdicts
          </button>
        </>
      ) : state.kind === "reading" ? (
        <p className="am-status">Reading every bound on the film.</p>
      ) : state.kind === "failed" ? (
        <div className="am-alert" role="alert">
          <strong>The verdicts could not be read</strong>
          <pre className="am-message">{state.message}</pre>
        </div>
      ) : state.report.clean ? (
        <p className="am-ok">Clean: every bound holds.</p>
      ) : (
        <>
          <p className="am-alert">
            <strong>
              {state.report.findings.length}{" "}
              {state.report.findings.length === 1 ? "bound does" : "bounds do"}{" "}
              not hold.
            </strong>
          </p>
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Bound</th>
                  <th>Where</th>
                  <th className="am-number">Value</th>
                  <th className="am-number">Limit</th>
                  <th className="am-number">At (s)</th>
                  <th>Of</th>
                </tr>
              </thead>
              <tbody>
                {state.report.findings.map(
                  (
                    finding: IPlaygroundVerdicts.IFinding,
                    index: number,
                  ): ReactElement => (
                    <tr key={index}>
                      <td className="am-mono">{finding.check}</td>
                      <td className="am-mono">
                        {finding.act === ""
                          ? finding.subject
                          : `${finding.subject}.${finding.act}#${finding.instance}`}
                      </td>
                      <td className="am-number">{finding.value.toFixed(4)}</td>
                      <td className="am-number">{finding.limit}</td>
                      <td className="am-number">
                        {finding.seconds.toFixed(2)}
                      </td>
                      <td>{finding.where}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
export namespace PlaygroundVerdicts {
  /** What the readout shows. */
  export type State =
    | { kind: "idle" }
    | { kind: "reading" }
    | { kind: "read"; report: IPlaygroundVerdicts }
    | { kind: "failed"; message: string };
}
