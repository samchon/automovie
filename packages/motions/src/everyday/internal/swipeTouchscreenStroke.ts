import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanTiming } from "../../compose/AutoMovieMotionHumanTiming";
import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";

/** Mean contact time in seconds for a single-finger swipe (Jeong, Table 2.6). */
const SWIPE_SECONDS: number = 0.2851;

/** Normalized endpoint tolerance used by `HumanSegmentEntry` and `HumanSegmentCut`. */
const CONTACT_SHARE_TOLERANCE: number = 1e-9;

/**
 * Prepare the touchscreen stroke's clock and its straight path. The hand
 * approaches from rest, presses along the screen and withdraws to rest. Those
 * phases remain distinct at the action's actual film time.
 *
 * @param props The entry, authored stroke points and chosen timing.
 * @returns The phrase's clock, the contact's endpoints in local seconds and
 *   the point of the stroke at a progress share.
 * @throws {HumanRefusal} If the film clock cannot distinguish the three phases.
 */
export function swipeTouchscreenStroke(
  props: swipeTouchscreenStroke.IProps,
): swipeTouchscreenStroke.IStroke {
  const {
    first,
    last,
    rest,
    seconds,
    start,
    tempo,
  }: swipeTouchscreenStroke.IProps = props;
  const travel = (point: IAutoMovieVector3): number =>
    tempo * AutoMovieMotionHumanTiming.transport(Vector3.distance(point, rest));
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: travel(first),
    attack: (tempo * seconds) / 2,
    follow: (tempo * seconds) / 2,
    retract: travel(last),
  });
  const touchIn: number = clock.at("strokeStart");
  const touchOut: number = clock.at("strokeEnd");
  const moves = (from: string, to: string): boolean => {
    const a: number = start + clock.at(from);
    const b: number = start + clock.at(to);
    const middle: number = a + (b - a) / 2;
    const progress: number = clock.progress(from, to, middle - start);
    return a < middle && middle < b && 0 < progress && progress < 1;
  };
  if (
    !(
      moves("start", "ready") &&
      moves("strokeStart", "strokeEnd") &&
      moves("relax", "end") &&
      touchOut / clock.duration < 1 - CONTACT_SHARE_TOLERANCE
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: seconds,
      reason:
        "the clock must distinguish reach, screen contact and complete withdrawal",
      fix: "choose a contact duration that preserves the reach and withdrawal on the film clock",
    });
  return {
    clock,
    touchIn,
    touchOut,
    point: (progress: number): IAutoMovieVector3 =>
      Vector3.lerp(first, last, progress),
  };
}

/** Inputs and clocks of the touchscreen stroke. */
export namespace swipeTouchscreenStroke {
  /** The points and times of a swipe. */
  export interface IProps {
    /** The contact's opening point, world metres. */
    first: IAutoMovieVector3;

    /** The contact's closing point, world metres. */
    last: IAutoMovieVector3;

    /** The fingertip's rest point, world metres. */
    rest: IAutoMovieVector3;

    /** The chosen contact duration before tempo, seconds. */
    seconds: number;

    /** Action start in the film, seconds. */
    start: number;

    /** The factor multiplying each moving span. */
    tempo: number;
  }

  /** A clock and the points it reads through the contact. */
  export interface IStroke {
    /** The complete phrase clock, in local seconds. */
    clock: IAutoMovieMotionClock;

    /** Local second when the glass first bears. */
    touchIn: number;

    /** Local second when the glass stops bearing. */
    touchOut: number;

    /** Place the linear stroke at its local progress. */
    point(progress: number): IAutoMovieVector3;
  }

  /** Admit the authored contact seconds or use Jeong's measured duration. */
  export function seconds(duration?: number): number {
    return HumanBound.above("duration", duration ?? SWIPE_SECONDS, 0, "s");
  }
}
