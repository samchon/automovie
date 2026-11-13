import type { ReactElement } from "react";

import type { ISceneManifest } from "../../scenes/structures/ISceneManifest";

/**
 * Every performer's placed actions on the film clock: a bar per action,
 * performed-over actions in a second lane, over a table of the same.
 *
 * @param props The take and the performers' roles by subject.
 * @returns The timeline.
 */
export function SceneTimeline(props: {
  take: ISceneManifest.ITake;
  roles: Record<string, string>;
}): ReactElement {
  const { take } = props;
  const share: (seconds: number) => string = (seconds: number): string =>
    `${((100 * seconds) / Math.max(1e-9, take.duration)).toFixed(3)}%`;
  return (
    <figure className="am-scene-timeline">
      <div className="am-scene-timeline-tracks" aria-hidden="true">
        {take.figures.map(
          (figure: ISceneManifest.IFigure, i: number): ReactElement => (
            <div key={figure.subject} className="am-scene-timeline-track">
              <span className="am-scene-timeline-name am-mono">
                {figure.subject}
              </span>
              <span className="am-scene-timeline-lane">
                {take.timeline[i]!.map(
                  (span: ISceneManifest.ISpan, k: number): ReactElement => (
                    <span
                      key={k}
                      className="am-scene-timeline-span"
                      data-overlay={span.overlay}
                      style={{
                        left: share(span.from),
                        width: share(span.to - span.from),
                      }}
                      title={`${span.name}, ${span.from.toFixed(2)} to ${span.to.toFixed(2)} s`}
                    >
                      {span.name}
                    </span>
                  ),
                )}
              </span>
            </div>
          ),
        )}
      </div>
      <figcaption className="am-muted">
        Each person&apos;s actions on the film clock, {take.duration.toFixed(2)}{" "}
        s.
      </figcaption>
      <table className="am-table">
        <thead>
          <tr>
            <th scope="col">Performer</th>
            <th scope="col">Action</th>
            <th scope="col">From</th>
            <th scope="col">To</th>
          </tr>
        </thead>
        <tbody>
          {take.figures.flatMap(
            (figure: ISceneManifest.IFigure, i: number): ReactElement[] =>
              take.timeline[i]!.map(
                (span: ISceneManifest.ISpan, k: number): ReactElement => (
                  <tr key={`${figure.subject}-${k}`}>
                    <td>
                      {figure.subject}
                      {props.roles[figure.subject] === undefined
                        ? ""
                        : `, ${props.roles[figure.subject]}`}
                    </td>
                    <td className="am-mono">
                      {span.name}
                      {span.overlay ? " (over)" : ""}
                    </td>
                    <td className="am-mono">{span.from.toFixed(2)}</td>
                    <td className="am-mono">{span.to.toFixed(2)}</td>
                  </tr>
                ),
              ),
          )}
        </tbody>
      </table>
    </figure>
  );
}
