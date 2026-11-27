import type { IAutoMovieMotionEvent } from "@automovie/interface";

/**
 * A hold's events: `held` once the arms have settled, a `pat<k>` each `1 /
 * rate` seconds after it while the hold lasts when the other palm pats the back
 * (the shoulder hold), and `relax` at the end.
 *
 * @param settle Seconds the arms take to bring the infant in.
 * @param duration The hold's whole seconds.
 * @param rate Pats a second.
 * @param pats Whether the other palm pats.
 * @returns The events, by share of the hold.
 */
export function holdInfantEvents(
  settle: number,
  duration: number,
  rate: number,
  pats: boolean,
): IAutoMovieMotionEvent[] {
  const events: IAutoMovieMotionEvent[] = [
    { name: "held", share: settle / duration },
  ];
  if (pats)
    for (let k: number = 1; settle + k / rate <= duration; k++)
      events.push({ name: `pat${k}`, share: (settle + k / rate) / duration });
  events.push({ name: "relax", share: 1 });
  return events;
}
