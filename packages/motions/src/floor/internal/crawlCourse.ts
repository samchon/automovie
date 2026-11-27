import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanCrawl,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Prepare every footprint and swing boundary once and return the original
 * minimum-jerk course, with a parabolic vertical lift during the swing.
 */
export function crawlCourse(
  props: crawlCourse.IProps,
): (
  limb: IAutoMovieMotionHumanCrawl.Limb,
  seconds: number,
) => IAutoMovieVector3 {
  const courses: Map<IAutoMovieMotionHumanCrawl.Limb, ICourse> = new Map();
  for (const limb of props.limbs) {
    const points: IAutoMovieVector3[] = [];
    const intervals: IInterval[] = [];
    for (let k: number = 0; k <= props.cycles; k++) {
      points.push(props.print(limb, k));
      if (k === 0) continue;
      const from: number = props.lift(limb, k);
      intervals.push({ from, to: from + props.swing });
    }
    courses.set(limb, {
      points,
      intervals,
      height: limb.endsWith("Hand") ? props.handLift : props.kneeLift,
    });
  }
  const swing: number = props.swing;
  return (
    limb: IAutoMovieMotionHumanCrawl.Limb,
    seconds: number,
  ): IAutoMovieVector3 => {
    const course: ICourse = courses.get(limb)!;
    let lo: number = 0;
    let hi: number = course.intervals.length;
    while (lo < hi) {
      const mid: number = Math.floor((lo + hi) / 2);
      if (seconds < course.intervals[mid]!.to) hi = mid;
      else lo = mid + 1;
    }
    if (lo === course.intervals.length) return { ...course.points[lo]! };
    const interval: IInterval = course.intervals[lo]!;
    if (seconds < interval.from) return { ...course.points[lo]! };

    const p: number = (seconds - interval.from) / swing;
    const at: IAutoMovieVector3 = Vector3.lerp(
      course.points[lo]!,
      course.points[lo + 1]!,
      AutoMovieEngineMotionSampling.minimumJerkShare(p),
    );
    return { ...at, y: at.y + 4 * course.height * p * (1 - p) };
  };
}

/**
 * Prepared support courses for a crawl. Footprints and exact swing boundaries
 * belong to its finite authored cycle list, and time queries search that list.
 */
export namespace crawlCourse {
  /** A finite authored support schedule. */
  export interface IProps {
    /** Limbs in the gait. */
    limbs: readonly IAutoMovieMotionHumanCrawl.Limb[];

    /** Positive integer count of authored cycles. */
    cycles: number;

    /**
     * World-metre footprint of a limb after its numbered swing, with cycle zero
     * the entry print. The returned point stays unchanged while this prepared
     * course owns it.
     */
    print(
      limb: IAutoMovieMotionHumanCrawl.Limb,
      cycle: number,
    ): IAutoMovieVector3;

    /**
     * Seconds of each numbered liftoff, one through cycles. For each limb these
     * times strictly increase, with the same positive swing duration.
     */
    lift(limb: IAutoMovieMotionHumanCrawl.Limb, cycle: number): number;

    /** Positive seconds from liftoff to touchdown. */
    swing: number;

    /** Palm's swing height, metres. */
    handLift: number;

    /** Knee's swing height, metres. */
    kneeLift: number;
  }
}

/** A swing's unchanged event seconds. */
interface IInterval {
  /** Liftoff, included in swing. */
  from: number;
  /** Touchdown, excluded from swing. */
  to: number;
}

/** One limb's prepared immutable gait data. */
interface ICourse {
  /** World-metre prints, from entry through the final cycle. */
  points: IAutoMovieVector3[];
  /** Increasing swing windows. */
  intervals: IInterval[];
  /** Metres of vertical lift. */
  height: number;
}
