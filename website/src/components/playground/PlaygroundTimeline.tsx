"use client";

import type { ReactElement } from "react";

import type { IPlaygroundTimeline } from "../../playground/structures/IPlaygroundTimeline";

/**
 * The performance on the film clock: one row per performer with a bar per
 * placed action and a tick per named instant, then the same as a table with
 * the seconds written out, which is what a screen reader reads.
 *
 * @param props The timeline.
 * @returns The readout.
 */
export function PlaygroundTimeline(props: {
  /** The timeline. */
  timeline: IPlaygroundTimeline;
}): ReactElement {
  const { timeline } = props;
  const share = (seconds: number): string =>
    `${timeline.duration <= 0 ? 0 : Math.min(100, Math.max(0, (seconds / timeline.duration) * 100))}%`;
  return (
    <section className="am-panel" aria-labelledby="am-timeline">
      <h2 id="am-timeline">Timeline</h2>
      <div aria-hidden="true">
        <div className="am-ruler">
          <span>0 s</span>
          <span>{(timeline.duration / 2).toFixed(2)} s</span>
          <span>{timeline.duration.toFixed(2)} s</span>
        </div>
        {timeline.tracks.map(
          (track: IPlaygroundTimeline.ITrack): ReactElement => (
            <div key={track.subject} className="am-track">
              <span className="am-track-name">{track.subject}</span>
              <div className="am-track-bars">
                {track.spans.map(
                  (
                    span: IPlaygroundTimeline.ISpan,
                    index: number,
                  ): ReactElement => (
                    <div
                      key={index}
                      className={
                        span.overlay ? "am-span am-span-overlay" : "am-span"
                      }
                      style={{
                        left: share(span.from),
                        width: `calc(${share(span.to)} - ${share(span.from)})`,
                      }}
                      title={`${span.name} ${span.from.toFixed(2)} to ${span.to.toFixed(2)} s`}
                    >
                      {span.name}
                    </div>
                  ),
                )}
                {track.spans.flatMap(
                  (
                    span: IPlaygroundTimeline.ISpan,
                    index: number,
                  ): ReactElement[] =>
                    span.events.map(
                      (
                        event: IPlaygroundTimeline.IEvent,
                        at: number,
                      ): ReactElement => (
                        <span
                          key={`${index}-${at}`}
                          className="am-event"
                          style={{ left: share(event.seconds) }}
                          title={`${span.name}: ${event.name} at ${event.seconds.toFixed(2)} s`}
                        />
                      ),
                    ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="am-table-wrap">
        <table className="am-table">
          <caption className="am-muted">
            Actions and their instants, in film seconds
          </caption>
          <thead>
            <tr>
              <th>Performer</th>
              <th>Action</th>
              <th className="am-number">From</th>
              <th className="am-number">To</th>
              <th>Instants</th>
            </tr>
          </thead>
          <tbody>
            {timeline.tracks.flatMap(
              (track: IPlaygroundTimeline.ITrack): ReactElement[] =>
                track.spans.map(
                  (
                    span: IPlaygroundTimeline.ISpan,
                    index: number,
                  ): ReactElement => (
                    <tr key={`${track.subject}-${index}`}>
                      <td className="am-mono">{track.subject}</td>
                      <td className="am-mono">
                        {span.name}
                        {span.id === span.name ? "" : ` (${span.id})`}
                        {span.overlay ? ", over" : ""}
                      </td>
                      <td className="am-number">{span.from.toFixed(2)}</td>
                      <td className="am-number">{span.to.toFixed(2)}</td>
                      <td>
                        {span.events
                          .map(
                            (event: IPlaygroundTimeline.IEvent): string =>
                              `${event.name} ${event.seconds.toFixed(2)}`,
                          )
                          .join(", ")}
                      </td>
                    </tr>
                  ),
                ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
