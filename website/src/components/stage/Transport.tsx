"use client";

import {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import type { SceneClock } from "../../scenes/SceneClock";

/** The speeds the transport offers. */
const SPEEDS: readonly number[] = [0.25, 0.5, 1, 1.5, 2];

/**
 * The transport under a player: play or pause, the scrubber, the time,
 * speed and loop. Its keys work while the player region has focus, as a
 * video player's do: Space and K play or pause, J and L seek a second,
 * comma and full stop step a frame, Home and End go to the ends.
 *
 * @param props The clock it drives.
 * @returns The bar.
 */
export function Transport(props: { clock: SceneClock }): ReactElement {
  const { clock } = props;
  const [, rerender] = useState<number>(0);

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
        aria-label={clock.playing ? "Pause" : "Play"}
        aria-pressed={clock.playing}
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
        onChange={(event): void => clock.seek(Number(event.target.value))}
      />
      <span className="am-transport-time am-mono">
        {clock.time.toFixed(2)} / {clock.duration.toFixed(2)} s
      </span>
      <label className="am-transport-speed">
        <span className="am-visually-hidden">Speed</span>
        <select
          value={clock.speed}
          onChange={(event): void =>
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
          onChange={(event): void => clock.set({ loop: event.target.checked })}
        />
        Loop
      </label>
    </div>
  );
}

/**
 * A region whose keys drive a clock, wrapping a player and its transport.
 *
 * @param props The clock, a label and the content.
 * @returns The region.
 */
export function TransportKeys(props: {
  clock: SceneClock;
  label: string;
  children: ReactNode;
}): ReactElement {
  const { clock } = props;
  const keys = (event: KeyboardEvent<HTMLElement>): void => {
    // A control that takes the key itself keeps it.
    const target: HTMLElement = event.target as HTMLElement;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
    const actions: Record<string, () => void> = {
      " ": (): void => clock.toggle(),
      k: (): void => clock.toggle(),
      j: (): void => clock.seek(clock.time - 1),
      l: (): void => clock.seek(clock.time + 1),
      ",": (): void => clock.step(-1),
      ".": (): void => clock.step(1),
      Home: (): void => clock.seek(0),
      End: (): void => clock.seek(clock.duration),
    };
    const action: (() => void) | undefined = actions[event.key];
    if (action === undefined) return;
    event.preventDefault();
    action();
  };
  return (
    <section
      className="am-player"
      aria-label={props.label}
      onKeyDown={keys}
    >
      {props.children}
    </section>
  );
}
