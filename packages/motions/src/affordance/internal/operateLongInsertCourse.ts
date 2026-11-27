import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * The course of a long insertion (`operateLongInsert`): a staff driven down a
 * bore farther than one grip reaches, hand over hand, with steps where the
 * stance runs out, then drawn out the same way when asked. Every place is read
 * on the bore's axis, `X(u) = mouth + u n`, `u` metres out of the mouth along
 * its outward normal `n`, in closed form.
 *
 * Each hand reaches the stretch of the axis within its shoulder's reach, the
 * chord the reach sphere cuts from the line (the line-sphere roots
 * `pickUpStepReach` takes too), never nearer the mouth than the clearance a
 * hand keeps off the muzzle's face. The carrying hand (`A`, the one that held
 * the staff as the act began) holds nearer the mouth and the steadying hand
 * (`B`) a hand's breadth behind it on the staff, so the two never pass. A cycle
 * drives the staff in with both hands together (A carries, B moves with it),
 * slides B back out along the staff as far as it reaches, then slides A back
 * out to just inside B while B steadies the staff, so the hands regrip in turn.
 * When a cycle can gain nothing more, the body steps along the bore's
 * horizontal line, toward the mouth going in and away coming out, as far as
 * keeps both held places within reach. Drawing out mirrors it: both hands pull
 * out together, A slides back in to the mouth, then B to just behind it. At the
 * end A slides back to the place it held the staff at the start, the head at
 * the mouth, so the grip it keeps afterwards is the one it entered with.
 *
 * `slide` is how far A has moved along the staff from its entry grip, away from
 * the working point; the depth follows as `d = l + slide - uA`, `l` the entry
 * grip's distance behind the working point.
 * Parameter props: The bore, the shoulders, the staff and the depth.
 * Returns: The stance before the first stroke, the presentation and the
 * segments in order.
 * When the staff is too short for the depth, or no
 * stance holds the presentation or the next grip.
 */
export function operateLongInsertCourse(
  props: operateLongInsertCourse.IProps,
): operateLongInsertCourse.IResult {
  const n: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(props.normal);
  const along: IAutoMovieVector3 = props.step;
  const at: (u: number) => IAutoMovieVector3 = (u: number): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(props.mouth, AutoMovieEngineVector3.scale(n, u));
  const shoulder: (
    hand: operateLongInsertCourse.Hand,
    x: number,
  ) => IAutoMovieVector3 = (
    hand: operateLongInsertCourse.Hand,
    x: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(props.shoulders[hand], AutoMovieEngineVector3.scale(along, x));
  // The hand's chord of the axis at a stance.
  const chord: (
    hand: operateLongInsertCourse.Hand,
    x: number,
  ) => operateLongInsertCourse.IRange = (
    hand: operateLongInsertCourse.Hand,
    x: number,
  ): operateLongInsertCourse.IRange => {
    const m: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      props.mouth,
      shoulder(hand, x),
    );
    const b: number = AutoMovieEngineVector3.dot(n, m);
    const disc: number = b * b - AutoMovieEngineVector3.dot(m, m) + props.reach * props.reach;
    if (disc < 0) return { lo: Infinity, hi: -Infinity };
    return { lo: -b - Math.sqrt(disc), hi: -b + Math.sqrt(disc) };
  };
  // The stances, metres along the step line, that keep a place within a
  // hand's reach.
  const stances: (
    hand: operateLongInsertCourse.Hand,
    u: number,
  ) => operateLongInsertCourse.IRange = (
    hand: operateLongInsertCourse.Hand,
    u: number,
  ): operateLongInsertCourse.IRange => {
    const p: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(at(u), props.shoulders[hand]);
    const b: number = AutoMovieEngineVector3.dot(p, along);
    const disc: number = b * b - AutoMovieEngineVector3.dot(p, p) + props.reach * props.reach;
    if (disc < 0) return { lo: Infinity, hi: -Infinity };
    return { lo: b - Math.sqrt(disc), hi: b + Math.sqrt(disc) };
  };
  const both: (uA: number, uB: number) => operateLongInsertCourse.IRange = (
    uA: number,
    uB: number,
  ): operateLongInsertCourse.IRange => {
    const a: operateLongInsertCourse.IRange = stances("A", uA);
    const b: operateLongInsertCourse.IRange = stances("B", uB);
    return { lo: Math.max(a.lo, b.lo), hi: Math.min(a.hi, b.hi) };
  };
  const refuse: (reason: string, fix: string) => never = (
    reason: string,
    fix: string,
  ): never => {
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "kind",
      value: props.depth,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: Math.max(0, props.shaft.hi - props.clear - props.gap),
        unit: "m",
      },
      reason,
      fix,
    });
  };
  if (props.depth > props.shaft.hi - props.clear - props.gap)
    refuse(
      `the staff's grip runs ${props.shaft.hi.toFixed(3)} m behind its working point, so with a hand's clearance and a second hand behind it no more than ${(props.shaft.hi - props.clear - props.gap).toFixed(3)} m goes in, short of ${props.depth.toFixed(3)} m`,
      "use a longer staff, or insert less deep",
    );

  // The presentation: the working point at the mouth, A where it holds the
  // staff and B a hand's breadth behind it.
  const l: number = props.grip;
  const presented: operateLongInsertCourse.IState = {
    x: 0,
    uA: l,
    uB: Math.min(l + props.gap, props.shaft.hi),
    slide: 0,
  };
  const segments: operateLongInsertCourse.ISegment[] = [];
  const stanceFor: (
    uA: number,
    uB: number,
    from: number,
  ) => number | undefined = (
    uA: number,
    uB: number,
    from: number,
  ): number | undefined => {
    const range: operateLongInsertCourse.IRange = both(uA, uB);
    if (range.lo > range.hi) return undefined;
    return Math.min(range.hi, Math.max(range.lo, from));
  };
  const first: number | undefined = stanceFor(presented.uA, presented.uB, 0);
  if (first === undefined)
    refuse(
      `no stance along the bore puts the staff's grip ${l.toFixed(3)} m out of the mouth and a second hand behind it within both arms`,
      "take the staff nearer its working point, or stand nearer the bore's line",
    );
  presented.x = first!;
  let state: operateLongInsertCourse.IState = { ...presented };
  const depth: (s: operateLongInsertCourse.IState) => number = (
    s: operateLongInsertCourse.IState,
  ): number => l + s.slide - s.uA;
  const push: (
    kind: operateLongInsertCourse.Kind,
    next: operateLongInsertCourse.IState,
  ) => void = (
    kind: operateLongInsertCourse.Kind,
    next: operateLongInsertCourse.IState,
  ): void => {
    segments.push({ kind, from: state, to: next });
    state = next;
  };
  const step: (toward: number, lowest: boolean) => boolean = (
    toward: number,
    lowest: boolean,
  ): boolean => {
    // The stance keeping both held places within reach, as far as it goes
    // the way asked.
    const range: operateLongInsertCourse.IRange = both(state.uA, state.uB);
    if (range.lo > range.hi) return false;
    const x: number = lowest
      ? Math.max(range.lo, Math.min(state.x, toward))
      : Math.min(range.hi, Math.max(state.x, toward));
    if (Math.abs(x - state.x) <= EPSILON) return false;
    push("step", { ...state, x });
    return true;
  };

  // Drive in.
  for (let k: number = 0; depth(state) < props.depth - EPSILON; ++k) {
    if (k >= MOST)
      refuse(
        `the staff makes no headway down the bore after ${MOST} strokes, regrips and steps`,
        "stand nearer the bore's line",
      );
    const a: operateLongInsertCourse.IRange = chord("A", state.x);
    const b: operateLongInsertCourse.IRange = chord("B", state.x);
    const gain: number = Math.min(
      state.uA - Math.max(a.lo, props.clear),
      state.uB - b.lo,
      props.depth - depth(state),
    );
    if (gain > EPSILON) {
      push("push", { ...state, uA: state.uA - gain, uB: state.uB - gain });
      continue;
    }
    // Regrip: B as far back as it reaches on the staff, then A behind it.
    const end: number = props.shaft.hi - depth(state);
    const uB: number = Math.min(b.hi, end);
    const uA: number = Math.min(a.hi, uB - props.gap);
    const next: number = uA - Math.max(a.lo, props.clear);
    if (uB > state.uB + EPSILON && uA > state.uA + EPSILON && next > EPSILON) {
      push("slideB", { ...state, uB });
      push("slideA", {
        ...state,
        uA,
        slide: state.slide + (uA - state.uA),
      });
      continue;
    }
    // The stance runs out: step toward the mouth until the held places lie
    // at the arms' far reach, so the next stroke runs the whole chord.
    if (!step(Infinity, false))
      refuse(
        `at ${depth(state).toFixed(3)} m down the bore no stance keeps both hands on the staff and brings the carrying hand nearer the mouth`,
        "stand nearer the bore's line",
      );
  }

  // Draw out.
  for (let k: number = 0; props.withdraw && depth(state) > EPSILON; ++k) {
    if (k >= MOST)
      refuse(
        `the staff makes no headway out of the bore after ${MOST} strokes, regrips and steps`,
        "stand nearer the bore's line",
      );
    const a: operateLongInsertCourse.IRange = chord("A", state.x);
    const b: operateLongInsertCourse.IRange = chord("B", state.x);
    const gain: number = Math.min(
      a.hi - state.uA,
      b.hi - state.uB,
      depth(state),
    );
    if (gain > EPSILON) {
      push("pull", { ...state, uA: state.uA + gain, uB: state.uB + gain });
      continue;
    }
    // Regrip: A back in toward the mouth, on the staff outside it, then B.
    const uA: number = Math.max(
      a.lo,
      props.clear,
      props.shaft.lo - depth(state),
    );
    const uB: number = Math.max(b.lo, uA + props.gap);
    const next: number = Math.min(a.hi - uA, b.hi - uB);
    if (uA < state.uA - EPSILON && next > EPSILON) {
      push("slideA", {
        ...state,
        uA,
        slide: state.slide + (uA - state.uA),
      });
      if (uB < state.uB - EPSILON) push("slideB", { ...state, uB });
      continue;
    }
    // The stance runs out: step back from the mouth until the held places
    // lie at the arms' near reach.
    if (!step(-Infinity, true))
      refuse(
        `at ${depth(state).toFixed(3)} m down the bore no stance keeps both hands on the staff and lets them draw it farther out`,
        "stand nearer the bore's line",
      );
  }

  // Home: A back to the place it entered with, B clear behind it. Each hand
  // slides where it stands as far toward its place as its reach allows (the
  // chord at the stance), B first so A never passes it; only when a place
  // lies beyond reach does the body step, toward the stances that reach the
  // places, as far as keeps the hands where they hold.
  if (props.withdraw && Math.abs(state.slide) > EPSILON) {
    const home: number = l - depth(state);
    const goalB: number = Math.max(state.uB, home + props.gap);
    for (let k: number = 0; Math.abs(state.uA - home) > EPSILON; ++k) {
      if (k >= MOST)
        refuse(
          `the carrying hand makes no headway back to the place it took the staff by after ${MOST} slides and steps`,
          "stand nearer the bore's line",
        );
      const a: operateLongInsertCourse.IRange = chord("A", state.x);
      const b: operateLongInsertCourse.IRange = chord("B", state.x);
      const uB: number = clampToward(state.uB, goalB, b);
      if (Math.abs(uB - state.uB) > EPSILON) push("slideB", { ...state, uB });
      const uA: number = clampToward(state.uA, home, {
        lo: Math.max(a.lo, props.clear),
        hi: Math.min(a.hi, state.uB - props.gap),
      });
      if (Math.abs(uA - state.uA) > EPSILON)
        push("slideA", { ...state, uA, slide: state.slide + (uA - state.uA) });
      if (Math.abs(state.uA - home) <= EPSILON) break;
      const reached: operateLongInsertCourse.IRange = both(home, goalB);
      const held: operateLongInsertCourse.IRange = both(state.uA, state.uB);
      const x: number = Math.min(
        held.hi,
        Math.max(held.lo, Math.min(reached.hi, Math.max(reached.lo, state.x))),
      );
      if (held.lo > held.hi || Math.abs(x - state.x) <= EPSILON)
        refuse(
          "no stance lets the carrying hand return to the place it took the staff by",
          "stand nearer the bore's line",
        );
      push("step", { ...state, x });
    }
  }
  return { presented, segments };
}

/*
 * The inputs and records of operateLongInsertCourse.
 */
export namespace operateLongInsertCourse {
  /*
   * The carrying hand (`A`) or the steadying one (`B`).
   */
  export type Hand = "A" | "B";

  /*
   * A segment's kind.
   */
  export type Kind = "push" | "pull" | "slideA" | "slideB" | "step";

  /*
   * A closed range, metres.
   */
  export interface IRange {
    /*
     * Its low end.
     */
    lo: number;

    /*
     * Its high end.
     */
    hi: number;
  }

  /*
   * The bore, the body and the staff.
   */
  export interface IProps {
    /*
     * The bore's mouth, world metres.
     */
    mouth: IAutoMovieVector3;

    /*
     * The bore's outward normal, world.
     */
    normal: IAutoMovieVector3;

    /*
     * Each hand's shoulder at the entry stance, world metres.
     */
    shoulders: Readonly<Record<Hand, IAutoMovieVector3>>;

    /*
     * The unit horizontal line a step moves the body along, toward the mouth.
     */
    step: IAutoMovieVector3;

    /*
     * How far from its shoulder a hand holds, metres.
     */
    reach: number;

    /*
     * How far behind the working point the carrying hand held the staff at
     * entry, metres.
     */
    grip: number;

    /*
     * The staff's grippable run, metres behind the working point.
     */
    shaft: IRange;

    /*
     * How near the mouth a hand comes, metres.
     */
    clear: number;

    /*
     * How far apart the two hands hold along the staff, metres.
     */
    gap: number;

    /*
     * How deep the working point goes, metres.
     */
    depth: number;

    /*
     * Whether the staff is drawn back out.
     */
    withdraw: boolean;
  }

  /*
   * Where the body and the hands are.
   */
  export interface IState {
    /*
     * The stance, metres along the step line from the entry's.
     */
    x: number;

    /*
     * The carrying hand's place on the axis, metres out of the mouth.
     */
    uA: number;

    /*
     * The steadying hand's place on the axis, metres out of the mouth.
     */
    uB: number;

    /*
     * How far the carrying hand has slid along the staff from its entry grip,
     * away from the working point, metres.
     */
    slide: number;
  }

  /*
   * One segment of the course.
   */
  export interface ISegment {
    /*
     * What moves.
     */
    kind: Kind;

    /*
     * The state it starts in.
     */
    from: IState;

    /*
     * The state it ends in.
     */
    to: IState;
  }

  /*
   * The course.
   */
  export interface IResult {
    /*
     * The presentation: the working point at the mouth, at the first stance.
     */
    presented: IState;

    /*
     * The segments after the presentation, in order.
     */
    segments: ISegment[];
  }
}

/*
 * The most strokes, regrips and steps one insertion plans before it refuses as
 * a staff that makes no headway.
 */
const MOST: number = 64;

/*
 * Metres below which a stroke, a slide or a step is no movement.
 */
const EPSILON: number = 1e-4;

/*
 * A place moved from where it is toward a goal, as far as a range allows, never
 * back past where it started.
 * Parameter from: Where it is.
 * Parameter goal: Where it goes.
 * Parameter range: The places it may take.
 * Returns: The place it reaches.
 */
function clampToward(
  from: number,
  goal: number,
  range: operateLongInsertCourse.IRange,
): number {
  const reach: number = Math.min(range.hi, Math.max(range.lo, goal));
  return goal >= from ? Math.max(from, reach) : Math.min(from, reach);
}
