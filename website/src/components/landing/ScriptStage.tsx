"use client";

import { type Dispatch, type ReactElement, type SetStateAction, useState } from "react";

import type { ILandingFilm } from "../../landing/ILandingFilm";
import type { IPlaygroundTimeline } from "../../playground/structures/IPlaygroundTimeline";
import type { ITake } from "../../takes/structures/ITake";
import { FigureCanvas } from "../figure/FigureCanvas";

/**
 * A screenplay scene file beside the take that performs it. While the take
 * plays, the beat whose actions are playing is lit, so the visitor sees each
 * written beat become motion. The beats' windows come from the take's own
 * timeline: each beat spans its first named action's start to its last
 * one's end.
 *
 * @param props The film.
 * @returns The composite.
 */
export function ScriptStage(props: { film: ILandingFilm }): ReactElement {
  const { film }: { film: ILandingFilm } = props;
  const [windows, setWindows]: [
    [number, number][] | null,
    Dispatch<SetStateAction<[number, number][] | null>>,
  ] = useState<[number, number][] | null>(null);
  const [now, setNow]: [IClock, Dispatch<SetStateAction<IClock>>] = useState<IClock>({
    seconds: 0,
    duration: 1,
  });
  const active: number =
    windows?.findIndex(
      ([from, to]: [number, number]): boolean =>
        now.seconds >= from && now.seconds < to,
    ) ?? -1;

  return (
    <div className="am-script-stage">
      <article className="am-script-page" aria-label="The screenplay scene file">
        <p className="am-script-file">{film.file}</p>
        <h3 className="am-script-h1"># {film.heading}</h3>
        <p className="am-script-h2">
          ## {film.section.title} <span className="am-script-anchor">{`{#${film.section.anchor}}`}</span>
        </p>
        <ol className="am-script-beats">
          {film.beats.map(
            (beat: ILandingFilm.IBeat, index: number): ReactElement => (
              <li key={beat.anchor} data-active={index === active}>
                <p className="am-script-h3">
                  ### {beat.title}{" "}
                  <span className="am-script-anchor">{`{#${beat.anchor}}`}</span>
                </p>
                <p>{beat.text}</p>
              </li>
            ),
          )}
        </ol>
      </article>
      <figure className="am-script-figure">
        <FigureCanvas
          kind="scene"
          id={film.scene}
          view={film.view}
          label={`The scene ${film.heading}, performed: ${film.beats.map((b: ILandingFilm.IBeat): string => b.text).join(" ")}`}
          still={2.4}
          onLoad={(take: ITake): void => setWindows(windowsOf(film, take))}
          onTime={(seconds: number, duration: number): void => {
            // Re-render only when the shown tenth of a second changes.
            setNow((before: IClock): IClock =>
              Math.abs(before.seconds - seconds) < 0.1
                ? before
                : { seconds, duration },
            );
          }}
        />
        <div className="am-script-timeline" aria-hidden="true">
          {windows?.map(
            ([from, to]: [number, number], index: number): ReactElement => (
              <span
                key={film.beats[index]!.anchor}
                data-active={index === active}
                style={{
                  left: `${(from / now.duration) * 100}%`,
                  width: `${((to - from) / now.duration) * 100}%`,
                }}
              >
                {film.beats[index]!.anchor}
              </span>
            ),
          )}
          <i style={{ left: `${(now.seconds / now.duration) * 100}%` }} />
        </div>
        <figcaption>
          Computed from the scene&apos;s code by the engine, seed{" "}
          <code>{film.scene}</code>. Every replay draws the same frames.
        </figcaption>
      </figure>
    </div>
  );
}

/** Each beat's window on the take's clock, from its actions' spans. */
function windowsOf(film: ILandingFilm, take: ITake): [number, number][] {
  return film.beats.map((beat: ILandingFilm.IBeat): [number, number] => {
    let from: number = Infinity;
    let to: number = -Infinity;
    for (const [subject, [first, last]] of Object.entries(beat.spans)) {
      const spans: IPlaygroundTimeline.ISpan[] | undefined = take.timeline.tracks
        .find((t: IPlaygroundTimeline.ITrack): boolean => t.subject === subject)
        ?.spans.filter((s: IPlaygroundTimeline.ISpan): boolean => !s.overlay);
      if (spans === undefined) continue;
      const a: IPlaygroundTimeline.ISpan | undefined = spans[first];
      const b: IPlaygroundTimeline.ISpan | undefined = spans[last];
      if (a !== undefined) from = Math.min(from, a.from);
      if (b !== undefined) to = Math.max(to, b.to);
    }
    return Number.isFinite(from) && Number.isFinite(to) ? [from, to] : [0, 0];
  });
}

/** The second shown and the take's length, which light a beat and place the playhead. */
interface IClock {
  /** The second shown. */
  seconds: number;

  /** The take's length, seconds. */
  duration: number;
}
