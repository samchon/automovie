import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { crawl } from "./crawl";

/**
 * Prepared support courses for a crawl. Footprints and exact swing boundaries
 * belong to its finite authored cycle list, and time queries search that list.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the finite schedule and the ownership of prepared points and boundaries; members state seconds and metres.
 * @evidence contracts/development/design.md#principled-representation Existing crawl limb names, world vectors and time callbacks describe the same support course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder is consumed by the crawl law; no action parameter or public motion primitive is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the caller's exact footprints, instants and lift heights; no gait table or tolerance is duplicated.
 */
export namespace crawlCourse {
  /**
   * A finite authored support schedule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every member states its role and coordinate or time unit.
   * @evidence contracts/development/design.md#principled-representation Names the existing gait's points, intervals and two lift heights directly.
   * @evidence contracts/development/design.md#minimal-and-owned-surface All seven inputs serve the existing crawl law and one query function.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Callbacks retain the law's exact arithmetic for event times and footprint positions.
   */
  export interface IProps {
    /** Limbs in the gait. */
    limbs: readonly crawl.Limb[];

    /** Positive integer count of authored cycles. */
    cycles: number;

    /** World-metre footprint of a limb after its numbered swing. */
    print(limb: crawl.Limb, cycle: number): IAutoMovieVector3;

    /** Seconds of each numbered liftoff, one through cycles. */
    lift(limb: crawl.Limb, cycle: number): number;

    /** Positive seconds from liftoff to touchdown. */
    swing: number;

    /** Palm's swing height, metres. */
    handLift: number;

    /** Knee's swing height, metres. */
    kneeLift: number;
  }

  /**
   * Prepare every footprint and swing boundary once and return the original
   * minimum-jerk course, with a parabolic vertical lift during the swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States preparation, the horizontal course and the vertical lift.
   * @evidence contracts/development/implementation.md#principled-implementation Binary search finds the first touchdown strictly after the query; its liftoff comparison retains the original half-open swing and closed planted endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns a small table per limb and the evaluator contains one boundary search and one interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same lift/print callbacks, minimum-jerk expression and lift polynomial are used at the same exact seconds; no sample or boundary tolerance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms L limbs and C cycles require O(LC) prepared points/times; each query is O(log C), replacing the original O(C) scan and repeated world transforms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only immutable authored footprints and exact event seconds are shared across time queries; no posture, solver result or previous query determines the course.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure retains C+1 points and C interval records per limb, proportional to the law's existing events and contacts, until its plan is released.
   */
  export function of(props: IProps): (limb: crawl.Limb, seconds: number) => IAutoMovieVector3 {
    const courses: Map<crawl.Limb, ICourse> = new Map();
    for (const limb of props.limbs) {
      const points: IAutoMovieVector3[] = [];
      const intervals: IInterval[] = [];
      for (let k: number = 0; k <= props.cycles; k++) {
        points.push(props.print(limb, k));
        if (k === 0) continue;
        const from: number = props.lift(limb, k);
        intervals.push({ from, to: from + props.swing });
      }
      courses.set(limb, { points, intervals, height: limb.endsWith("Hand") ? props.handLift : props.kneeLift });
    }
    const swing: number = props.swing;
    return (limb: crawl.Limb, seconds: number): IAutoMovieVector3 => {
      const course: ICourse = courses.get(limb)!;
      let lo: number = 0;
      let hi: number = course.intervals.length;
      while (lo < hi) {
        const mid: number = Math.floor((lo + hi) / 2);
        if (seconds < course.intervals[mid]!.to) hi = mid;
        else lo = mid + 1;
      }
      if (lo === course.intervals.length) return course.points[lo]!;
      const interval: IInterval = course.intervals[lo]!;
      if (seconds < interval.from) return course.points[lo]!;

      const p: number = (seconds - interval.from) / swing;
      const at: IAutoMovieVector3 = Vector3.lerp(course.points[lo]!, course.points[lo + 1]!, minimumJerk(p).s);
      return { ...at, y: at.y + 4 * course.height * p * (1 - p) };
    };
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
}
