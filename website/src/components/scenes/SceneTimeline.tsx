import type { ReactElement } from "react";

import type { IPlaygroundTimeline } from "../../playground/structures/IPlaygroundTimeline";

/**
 * Every performer's placed actions on the film clock: a bar per action,
 * performed-over actions in a second lane, over a table of the same.
 *
 * @param props A computed take's timeline and the performers' roles by subject.
 * @returns The timeline.
 */
export function SceneTimeline(props: {
  timeline: IPlaygroundTimeline;
  roles: Record<string, string>;
}): ReactElement {
  const { timeline }: typeof props = props;
  const share: (seconds: number) => string = (seconds: number): string =>
    `${((100 * seconds) / Math.max(1e-9, timeline.duration)).toFixed(3)}%`;
  return (
    <figure className="am-scene-timeline">
      <div className="am-scene-timeline-tracks" aria-hidden="true">
        {timeline.tracks.map(
          (track: IPlaygroundTimeline.ITrack): ReactElement => (
            <div key={track.subject} className="am-scene-timeline-track">
              <span className="am-scene-timeline-name am-mono">
                {track.subject}
              </span>
              <span className="am-scene-timeline-lane">
                {track.spans.map(
                  (
                    span: IPlaygroundTimeline.ISpan,
                    k: number,
                  ): ReactElement => (
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
        Each person&apos;s actions on the film clock,{" "}
        {timeline.duration.toFixed(2)} s.
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
          {timeline.tracks.flatMap(
            (track: IPlaygroundTimeline.ITrack): ReactElement[] =>
              track.spans.map(
                (span: IPlaygroundTimeline.ISpan, k: number): ReactElement => (
                  <tr key={`${track.subject}-${k}`}>
                    <td>
                      {track.subject}
                      {props.roles[track.subject] === undefined
                        ? ""
                        : `, ${props.roles[track.subject]}`}
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
