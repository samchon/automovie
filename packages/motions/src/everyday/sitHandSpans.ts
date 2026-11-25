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
      SIDES.filter((side: AutoMovieHumanSide): boolean => !props.armrest(side)),
    ),
    until: contact,
  });
  const span = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmPlanned.ISpan => {
    if (props.armrest(side))
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
  return {
    legs,
    span,
    hand: (side: AutoMovieHumanSide, t: number): number => {
      const s: IAutoMovieMotionHumanArmPlanned.ISpan = span(side);
      return minimumJerk.share((t - s.start) / (s.ready - s.start));
    },
  };
}

/** The companion types of a sit's legs and hands' spans (`sitHandSpans`). */
export namespace sitHandSpans {
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
