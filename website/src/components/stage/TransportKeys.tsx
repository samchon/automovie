"use client";

import type { KeyboardEvent, ReactElement, ReactNode } from "react";

import type { SceneClock } from "../../scenes/SceneClock";

/** The elements that take a key themselves: a control keeps its own keys. */
const CONTROLS: string =
  'input, select, textarea, button, summary, a[href], [contenteditable=""], [contenteditable="true"], [role="button"], [role="tab"], [role="checkbox"], [role="slider"], [role="switch"]';

/**
 * A region whose keys drive a clock, wrapping a player and its transport, as
 * a video player's do: Space and K play or pause, J and L seek a second,
 * comma and full stop step a frame, Home and End go to the ends. A key held
 * with Ctrl, Alt or Meta, or pressed on a control, is left to the browser
 * and the control.
 *
 * @param props The clock, a label and the content.
 * @returns The region.
 */
export function TransportKeys(props: {
  clock: SceneClock;
  label: string;
  children: ReactNode;
}): ReactElement {
  const { clock }: typeof props = props;
  const keys: (event: KeyboardEvent<HTMLElement>) => void = (
    event: KeyboardEvent<HTMLElement>,
  ): void => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const target: EventTarget = event.target;
    if (target instanceof Element && target.closest(CONTROLS) !== null) return;
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
    const key: string =
      event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const action: (() => void) | undefined = actions[key];
    if (action === undefined) return;
    event.preventDefault();
    action();
  };
  return (
    <section className="am-player" aria-label={props.label} onKeyDown={keys}>
      {props.children}
    </section>
  );
}
