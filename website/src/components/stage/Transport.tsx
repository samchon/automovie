"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import type { SceneClock } from "../../scenes/SceneClock";

/** The speeds the transport offers. */
const SPEEDS: readonly number[] = [0.25, 0.5, 1, 1.5, 2];

/**
 * The transport under a player: play or pause, the scrubber, the time,
 * speed and loop. `TransportKeys` gives the region around it a video
 * player's keys.
 *
 * @param props The clock it drives.
 * @returns The bar.
 */
export function Transport(props: { clock: SceneClock }): ReactElement {
  const { clock }: typeof props = props;
  const [, rerender]: [number, Dispatch<SetStateAction<number>>] =
    useState<number>(0);

  // The bar follows the clock: its own changes at once, the playing time a
  // few times a second.
  useEffect((): (() => void) => {
    const off: () => void = clock.subscribe((): void =>
      rerender((n: number): number => n + 1),
    );
    const timer: number = window.setInterval((): void => {
      if (clock.playing) rerender((n: number): number => n + 1);
    }, 100);
    return (): void => {
      off();
      window.clearInterval(timer);
    };
  }, [clock]);

  const frame: number = Math.round(clock.time * clock.fps);
  const frames: number = Math.round(clock.duration * clock.fps);
  return (
    <div className="am-transport" role="group" aria-label="Playback">
      <button
        type="button"
        className="am-transport-play"
        onClick={(): void => clock.toggle()}
      >
        {clock.playing ? "Pause" : "Play"}
      </button>
      <input
        type="range"
        className="am-transport-scrub"
        min={0}
        max={clock.duration}
        step={1 / clock.fps}
        value={clock.time}
        aria-label="Time"
        aria-valuetext={`${clock.time.toFixed(2)} seconds, frame ${frame} of ${frames}`}
        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
          clock.seek(Number(event.target.value))
        }
      />
      <span className="am-transport-time am-mono">
        {clock.time.toFixed(2)} / {clock.duration.toFixed(2)} s
      </span>
      <label className="am-transport-speed">
        <span className="am-visually-hidden">Speed</span>
        <select
          value={clock.speed}
          onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
            clock.set({ speed: Number(event.target.value) })
          }
        >
          {SPEEDS.map(
            (speed: number): ReactElement => (
              <option key={speed} value={speed}>
                {speed}×
              </option>
            ),
          )}
        </select>
      </label>
      <label className="am-transport-loop">
        <input
          type="checkbox"
          checked={clock.loop}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            clock.set({ loop: event.target.checked })
          }
        />
        Loop
      </label>
    </div>
  );
}
