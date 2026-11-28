import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { motionHumanChannel } from "../../compose/internal/motionHumanChannel";
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

  /* The carrier fade and the claims retained by the next overlay. */
  export interface IRelease {
    weight: number;
    retained?: readonly AutoMovieMotionHumanChannelClaim[];
  }

  /* Fade unclaimed joints back to the carrier as an overlay ends. */
  export function released(
    person: IAutoMovieMotionHumanSegment.IPerson,
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    seconds: number,
  ): IRelease {
    const remaining: number = overlay.end - seconds;
    if (
      remaining >= HumanSegment.FADE ||
      (entering !== undefined && Math.abs(entering - overlay.end) <= HANDOFF)
    )
      return { weight: 1 };
    const retained: AutoMovieMotionHumanChannelClaim[] = person.overlays.flatMap(
      (candidate) =>
        candidate.index > overlay.index &&
        endsAt(overlay, candidate.entryTime) &&
        candidate.end > candidate.entryTime &&
        shares(overlay, candidate)
          ? candidate.channels
          : [],
    );
    if (
      retained.length > 0 &&
      overlay.channels.every((claim) =>
        motionHumanChannel.claims(retained, claim),
      )
    )
      return { weight: 1 };
    const weight: number = fadeOut(remaining, HumanSegment.FADE);
    return retained.length === 0 ? { weight } : { weight, retained };
  }

  /* The displayed entry joints owned by an earlier overlay at the handoff. */
  export function handedIn(
    person: IAutoMovieMotionHumanSegment.IPerson,
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose> | undefined {
    if (overlay.index === 0 || overlay.end <= overlay.entryTime) return undefined;
    const previous: IAutoMovieMotionHumanSegment.IOverlay[] =
      person.overlays.filter(
        (candidate) =>
          candidate.index < overlay.index &&
          endsAt(candidate, overlay.entryTime) &&
          shares(candidate, overlay),
      );
    if (previous.length === 0) return undefined;
    return new Map(
      overlay.context.entry.pose.joints
        .filter(({ bone }) =>
          previous.some((candidate) =>
            motionHumanChannel.covers(candidate.channels, bone),
          ),
        )
        .map((joint) => [joint.bone, joint]),
    );
  }

  /* A short overlay must start its inherited channel at full weight. */
  export function releaseHandoff(
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    seconds: number,
    release: number,
  ): number {
    const span: number = overlay.end - overlay.entryTime;
    return release >= 1 || span >= HumanSegment.FADE
      ? release
      : fadeOut(overlay.end - seconds, span);
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
    return (
      a.channels.some((channel) =>
        motionHumanChannel.claims(b.channels, channel),
      ) ||
      b.channels.some((channel) =>
        motionHumanChannel.claims(a.channels, channel),
      )
    );
  }

  /* Match only a played predecessor's realized ending second. */
  function endsAt(
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    seconds: number,
  ): boolean {
    return (
      overlay.end > overlay.entryTime &&
      Math.abs(overlay.end - seconds) <= HANDOFF
    );
  }

  /* Remaining release share for the given fade duration. */
  function fadeOut(remaining: number, duration: number): number {
    return AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, remaining / duration)),
    );
  }
}
