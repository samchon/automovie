import { AutoMovieEngineKeyframeSearch } from "@automovie/engine";

import { HumanKnot } from "./HumanKnot";
import { HumanKnotTiming } from "./HumanKnotTiming";
import { HumanMinimumJerkSpline } from "./HumanMinimumJerkSpline";
import { HumanQuinticSegment } from "./HumanQuinticSegment";

/*
 * Prepare a movement curve through knots and return its pure reader.
 *
 * The knots' holds (`HumanKnot.pieces`) split the curve into rest-to-rest
 * pieces, each joined by minimum-jerk quintics through its knots (Flash and
 * Hogan 1985, J. Neurosci. 5(7):1688; `HumanMinimumJerkSpline`,
 * `HumanQuinticSegment`). A fixed timing gives each knot's arrival second; an
 * optimal timing times each piece with TOPP-RA under its limits (Pham and Pham
 * 2018, IEEE T-RO 34(3):645; toppra, MIT; `HumanKnotTiming`). Each hold is an
 * explicit interval at its knot. Everything is solved here; a read only indexes
 * the prepared arrays by binary search and evaluates one closed-form
 * polynomial, so the reader answers any instant in any order.
 * Parameter knots: The knots, one or more, each with its dwell.
 * Parameter timing: How the pieces are timed.
 * Returns: The curve's reader.
 * When an optimal piece cannot be timed
 * (`HumanKnotTiming.parametrize`).
 */
export function prepareHumanKnotCourse(
  knots: readonly HumanKnot.IKnot[],
  timing: prepareHumanKnotCourse.ITiming,
): prepareHumanKnotCourse.ICourse {
  const spans: ISpan[] = [];
  const pieces: HumanKnot.IPiece[] = HumanKnot.pieces(knots);
  const zero: number[] = knots[0]!.position.map((): number => 0);
  let clock: number = timing.kind === "fixed" ? timing.times[0]! : 0;
  const hold: (k: number) => void = (k: number): void => {
    const knot: HumanKnot.IKnot = knots[k]!;
    if (knot.dwell > 0) {
      spans.push({
        kind: "hold",
        from: clock,
        position: knot.position,
      });
      clock += knot.dwell;
    }
  };
  hold(0);
  for (const piece of pieces) {
    const positions: (readonly number[])[] = knots
      .slice(piece.first, piece.last + 1)
      .map((knot: HumanKnot.IKnot): readonly number[] => knot.position);
    if (timing.kind === "fixed") {
      // The piece leaves its first knot when that knot's hold ends and
      // reaches each later knot at its given second.
      const times: number[] = [clock];
      for (let k: number = piece.first + 1; k <= piece.last; ++k)
        times.push(timing.times[k]!);
      const derived: HumanMinimumJerkSpline.IDerivatives =
        HumanMinimumJerkSpline.derivatives(times, positions);
      const segments: HumanQuinticSegment.ISegment[] = [];
      for (let j: number = 0; j + 1 < times.length; ++j)
        segments.push(
          HumanQuinticSegment.prepare(
            {
              position: positions[j]!,
              velocity: derived.velocities[j]!,
              acceleration: derived.accelerations[j]!,
            },
            {
              position: positions[j + 1]!,
              velocity: derived.velocities[j + 1]!,
              acceleration: derived.accelerations[j + 1]!,
            },
            times[j + 1]! - times[j]!,
          ),
        );
      spans.push({
        kind: "fixed",
        from: clock,
        times,
        segments,
      });
      clock = times[times.length - 1]!;
    } else {
      const timed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
        positions,
        segments: timing.segments.slice(piece.first, piece.last),
        knots: timing.knots?.slice(piece.first, piece.last + 1),
        precision: timing.precision,
        overshoot: timing.overshoot,
      });
      spans.push({
        kind: "optimal",
        from: clock,
        timed,
      });
      clock += timed.duration;
    }
    hold(piece.last);
  }
  const start: number = timing.kind === "fixed" ? timing.times[0]! : 0;
  const first: readonly number[] = knots[0]!.position;
  const last: readonly number[] = knots[knots.length - 1]!.position;
  const rest: (position: readonly number[]) => HumanQuinticSegment.IState = (
    position: readonly number[],
  ): HumanQuinticSegment.IState => ({
    position: [...position],
    velocity: [...zero],
    acceleration: [...zero],
    jerk: [...zero],
  });

  /*
   * The span holding an instant inside the curve, by binary search.
   */
  const find: (seconds: number) => ISpan = (seconds: number): ISpan => {
    let low: number = 0;
    let high: number = spans.length - 1;
    while (low < high) {
      const middle: number = (low + high + 1) >> 1;
      if (spans[middle]!.from <= seconds) low = middle;
      else high = middle - 1;
    }
    return spans[low]!;
  };
  return {
    start,
    end: clock,
    position: (seconds: number): number[] => {
      if (spans.length === 0 || seconds <= start) return [...first];
      if (seconds >= clock) return [...last];
      const span: ISpan = find(seconds);
      switch (span.kind) {
        case "hold":
          return [...span.position];
        case "fixed": {
          const j: number = AutoMovieEngineKeyframeSearch.segment(
            span.times.length,
            (index: number): number => span.times[index]!,
            seconds,
            "next",
          );
          return HumanQuinticSegment.position(
            span.segments[j]!,
            seconds - span.times[j]!,
          );
        }
        case "optimal":
          return HumanKnotTiming.position(span.timed, seconds - span.from);
      }
    },
    state: (seconds: number): HumanQuinticSegment.IState => {
      if (spans.length === 0 || seconds <= start) return rest(first);
      if (seconds >= clock) return rest(last);
      const span: ISpan = find(seconds);
      switch (span.kind) {
        case "hold":
          return rest(span.position);
        case "fixed": {
          const j: number = AutoMovieEngineKeyframeSearch.segment(
            span.times.length,
            (index: number): number => span.times[index]!,
            seconds,
            "next",
          );
          return HumanQuinticSegment.state(
            span.segments[j]!,
            seconds - span.times[j]!,
          );
        }
        case "optimal":
          return HumanKnotTiming.state(span.timed, seconds - span.from);
      }
    },
  };
}

/*
 * A knot curve's timing and its reader.
 */
export namespace prepareHumanKnotCourse {
  /*
   * Each knot's arrival second given: a knot's hold runs from its arrival, so
   * each arrival is later than the hold before it ends.
   */
  export interface IFixed {
    /*
     * The kind.
     */
    kind: "fixed";

    /*
     * Each knot's arrival, seconds on the caller's clock, ascending.
     */
    times: readonly number[];
  }

  /*
   * Each piece timed by TOPP-RA from rest to rest (`HumanKnotTiming`).
   */
  export interface IOptimal {
    /*
     * The kind.
     */
    kind: "optimal";

    /*
     * Each knot interval's limits, one fewer than the knots.
     */
    segments: readonly HumanKnotTiming.ILimit[];

    /*
     * Each knot's own limits, or null; none when absent.
     */
    knots?: readonly (HumanKnotTiming.ILimit | null)[];

    /*
     * The greatest chord error of a grid interval, in the coordinates' units
     * (`HumanKnotTiming.IProblem.precision`).
     */
    precision: number;

    /*
     * The greatest share of a limit the rate or acceleration may pass it by
     * between TOPP-RA's gridpoints (`HumanKnotTiming.IProblem.overshoot`).
     */
    overshoot: number;
  }

  /*
   * How a curve's pieces are timed.
   */
  export type ITiming = IFixed | IOptimal;

  /*
   * A prepared curve's pure reader.
   */
  export interface ICourse {
    /*
     * The curve's first second: the first arrival for a fixed timing, zero for
     * an optimal one.
     */
    start: number;

    /*
     * The second its last hold ends.
     */
    end: number;

    /*
     * The position at a second, the first knot's before the start and the
     * last's after the end.
     * Parameter seconds: The instant.
     * Returns: Each coordinate's position.
     */
    position(seconds: number): number[];

    /*
     * The position, velocity, acceleration and jerk at a second, at rest before
     * the start, after the end and in a hold.
     * Parameter seconds: The instant.
     * Returns: The state there.
     */
    state(seconds: number): HumanQuinticSegment.IState;
  }
}

/*
 * One interval of a prepared curve's timeline.
 */
type ISpan = IHoldSpan | IFixedSpan | IOptimalSpan;

/*
 * A hold at a knot.
 */
interface IHoldSpan {
  /*
   * The kind.
   */
  kind: "hold";

  /*
   * Its first second.
   */
  from: number;

  /*
   * The knot held.
   */
  position: readonly number[];
}

/*
 * A piece through knots at given seconds.
 */
interface IFixedSpan {
  /*
   * The kind.
   */
  kind: "fixed";

  /*
   * Its first second.
   */
  from: number;

  /*
   * Each of its knots' seconds.
   */
  times: readonly number[];

  /*
   * The quintic between each two of its knots, in seconds.
   */
  segments: readonly HumanQuinticSegment.ISegment[];
}

/*
 * A piece timed by TOPP-RA.
 */
interface IOptimalSpan {
  /*
   * The kind.
   */
  kind: "optimal";

  /*
   * Its first second.
   */
  from: number;

  /*
   * Its path and time map, from zero at `from`.
   */
  timed: HumanKnotTiming.ITimed;
}
