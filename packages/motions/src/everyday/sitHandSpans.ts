import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { courseHumanLegs } from "../compose/courseHumanLegs";
import { sitHandMeet } from "./sitHandMeet";

/**
 * A sit's legs planned once over it (`courseHumanLegs`: every reader of its
 * posture places them at this course, `IAutoMovieHumanLimbGoal.seed`, so the
 * thighs the hands are laid on are the thighs shown), and when each hand leaves
 * its hanging rest and when it rests, and how far it is on the way at a second.
 * A hand with an armrest is brought onto it from `reaching` of the descent to
 * seat contact. A hand with none hangs while the thighs come up under it and is
 * laid on its thigh from contact to seated; a hanging hand its rising thigh
 * meets before the seat takes the body (`sitHandMeet`, the body's own geometry)
 * lands on the thigh as the thigh comes up instead: its rest opens at that
 * instant, reached over the law's own reach time (seated less contact). The
 * course and the meeting instants are read once, here, at plan time.
 *
 * @param props The sit's timing, its lowering, its armrests and the entry.
 * @returns The legs' stamp and each hand's span and progress.
 */
export function sitHandSpans(props: sitHandSpans.IProps): sitHandSpans.ISpans {
  const { contact, descent, duration }: sitHandSpans.IProps = props;
  const braced: Readonly<Record<AutoMovieHumanSide, boolean>> = {
    left: props.armrest("left"),
    right: props.armrest("right"),
  };
  const legs: courseHumanLegs.Seeded = courseHumanLegs({
    body: props.body,
    posture: props.lowered,
    span: { start: 0, end: duration },
    instants: [contact, descent],
    entry: props.entry,
  });
  const meets: Partial<Record<AutoMovieHumanSide, number>> = sitHandMeet({
    body: props.body,
    posture: (seconds: number): IAutoMovieMotionHumanPosture =>
      legs(props.lowered(seconds), seconds),
    entry: props.entry,
    sides: new Set<AutoMovieHumanSide>(
      SIDES.filter((side: AutoMovieHumanSide): boolean => !braced[side]),
    ),
    until: contact,
  });
  const span = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmPlanned.ISpan => {
    if (braced[side])
      return {
        start: props.reaching * descent,
        ready: contact,
        relax: duration,
        end: duration,
      };
    const meet: number | undefined = meets[side];
    return meet !== undefined && meet < contact
      ? {
          start: Math.max(0, meet - (descent - contact)),
          ready: meet,
          relax: duration,
          end: duration,
        }
      : { start: contact, ready: descent, relax: duration, end: duration };
  };
  const prepared: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmPlanned.ISpan>
  > = { left: span("left"), right: span("right") };
  return {
    legs,
    span: (side: AutoMovieHumanSide): IAutoMovieMotionHumanArmPlanned.ISpan =>
      prepared[side],
    hand: (side: AutoMovieHumanSide, t: number): number =>
      sitHandSpans.progress(prepared[side], t),
  };
}

/** The companion types of a sit's legs and hands' spans (`sitHandSpans`). */
export namespace sitHandSpans {
  /**
   * Read the hand's progress over its prepared reach. A hand that already
   * meets its support at departure is resting from that second onward.
   *
   * @param span The start of the reach and the time the hand is in place.
   * @param seconds Seconds since the sit starts.
   * @returns The completed share of the reach.
   */
  export function progress(
    span: Pick<IAutoMovieMotionHumanArmPlanned.ISpan, "start" | "ready">,
    seconds: number,
  ): number {
    if (span.ready === span.start) return seconds < span.ready ? 0 : 1;
    return minimumJerk.share(
      (seconds - span.start) / (span.ready - span.start),
    );
  }

  /** What a sit's legs and hands are prepared from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The sit's posture at a second since its start, its legs, root and trunk
     * as it lowers them, before its legs' course; its arms are not read.
     */
    lowered(seconds: number): IAutoMovieMotionHumanPosture;

    /** The displayed pose the sit is entered with, whose arms hang. */
    entry: IAutoMoviePose;

    /** Whether a hand has an armrest. */
    armrest(side: AutoMovieHumanSide): boolean;

    /** The seat's contact, seconds since the sit's start. */
    contact: number;

    /** The second the body is seated. */
    descent: number;

    /** The sit's length, seconds. */
    duration: number;

    /**
     * The share of the descent a hand bound for an armrest leaves its hang at,
     * the law's own.
     */
    reaching: number;
  }

  /** The legs' stamp, and each hand's span and its progress along it. */
  export interface ISpans {
    /** A posture's leg goals stamped with the legs' course there. */
    legs: courseHumanLegs.Seeded;

    /** When a hand leaves its hanging rest and when it rests. */
    span(side: AutoMovieHumanSide): IAutoMovieMotionHumanArmPlanned.ISpan;

    /** How far a hand is from hanging to resting, at a second. */
    hand(side: AutoMovieHumanSide, t: number): number;
  }
}

/** The two hands, in the order their spans are read. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
