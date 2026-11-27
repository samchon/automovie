import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanSegment } from "./HumanSegment";

/*
 * When a person's overlays run and hand their channels on
 * (HumanSegmentOverlay): the overlays running at a second, an overlay chain's
 * next act reading its entry where the act before it ends, and how far an
 * overlay still holds its channels or a held prop past its end.
 */
export namespace HumanSegmentOverlayRun {
  /*
   * The overlays that run at a second.
   * Parameter person: The person.
   * Parameter seconds: Film seconds.
   * Returns: The overlays, in placement order.
   */
  export function running(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
  ): IAutoMovieMotionHumanSegment.IOverlay[] {
    return person.overlays.filter(
      (o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
        seconds >= o.entryTime - 1e-12 && seconds <= o.end + 1e-12,
    );
  }

  /*
   * Read a state with the overlays that end at a second handing their channels
   * on there: an overlay chain's next act is placed at the instant the act
   * before it ends, and reads its entry from that act's end, not from the
   * carrier the act would release to were nothing to follow it.
   * Parameter seconds: The film second the next act enters at.
   * Parameter run: The read.
   * Returns: What the read returns.
   */
  export function handing<T>(seconds: number, run: () => T): T {
    const enclosing: number | undefined = entering;
    entering = seconds;
    try {
      return run();
    } finally {
      entering = enclosing;
    }
  }

  /*
   * Whether an overlay's hand on a side holds a prop on past the overlay's end:
   * the overlay drives that hand, and a hold of it began by the end and lasts
   * beyond it, so the prop stays in the hand after the overlay is gone.
   */
  export function holdsOn(
    person: IAutoMovieMotionHumanSegment.IPerson,
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    side: AutoMovieHumanSide,
  ): boolean {
    return (
      HumanSegment.drives(overlay.plan, side) &&
      person.holds.some(
        (held: IAutoMovieMotionHumanSegment.IHeld): boolean =>
          held.side === side &&
          held.from <= overlay.end + HANDOFF &&
          held.until > overlay.end + HANDOFF,
      )
    );
  }

  /*
   * How far an overlay still holds its channels at a second, released to the
   * carrier over the fade before its end unless it hands them on.
   */
  export function released(
    person: IAutoMovieMotionHumanSegment.IPerson,
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    seconds: number,
  ): number {
    return handsOn(person, overlay)
      ? 1
      : AutoMovieEngineMotionSampling.minimumJerkShare(
          Math.min(1, Math.max(0, (overlay.end - seconds) / HumanSegment.FADE)),
        );
  }

  /*
   * The second an overlay chain's next act enters at, while its entry is read
   * (`HumanSegmentOverlayRun.handing`).
   */
  let entering: number | undefined;

  /*
   * Seconds two instants of one handoff may differ by.
   */
  const HANDOFF: number = 1e-9;

  /*
   * Whether two overlays claim a channel in common.
   */
  function shares(
    a: IAutoMovieMotionHumanSegment.IOverlay,
    b: IAutoMovieMotionHumanSegment.IOverlay,
  ): boolean {
    return a.channels.some((channel: (typeof a.channels)[number]): boolean =>
      b.channels.includes(channel),
    );
  }

  /*
   * Whether an overlay hands its channels on at its end: to one that enters
   * then, or to the act whose entry is being read there
   * (`HumanSegmentOverlayRun.handing`).
   */
  function handsOn(
    person: IAutoMovieMotionHumanSegment.IPerson,
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
  ): boolean {
    if (entering !== undefined && Math.abs(entering - overlay.end) <= HANDOFF)
      return true;
    return person.overlays.some(
      (o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
        o !== overlay &&
        Math.abs(o.entryTime - overlay.end) <= HANDOFF &&
        shares(o, overlay),
    );
  }
}
