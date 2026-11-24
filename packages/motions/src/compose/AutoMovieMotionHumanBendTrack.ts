import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendWalk } from "./AutoMovieMotionHumanBendWalk";

/** The alternatives of `PropsFallback`'s site. */
type PropsFallback =
  | IAutoMovieMotionHumanBend.Arm
  | IAutoMovieMotionHumanBend.IShares;

/**
 * The elbow of least strain of an arm a primitive writes over its span
 * (`AutoMovieMotionHumanBend.solve`), solved once when the action is planned
 * and continued through the span, in place of one cold search a posture
 * evaluation.
 *
 * The engine's swivel sweep is sized for a solve made once per authored action
 * (`hingedArmSwivel.STEP`). A primitive that asks `solve` in its `write` makes
 * it once per evaluated second instead. The track restores the premise: on the
 * frame grid the planner's holds are sampled on, from the primitive's start, it
 * keeps each knot's swivel and bend branch, the first knot solved cold and each
 * later one continued from the knot before it. A read at any second continues
 * from the seed interpolated between its two knots, so the elbow is a function
 * of the second alone, whatever order the seconds are read in, and at every
 * second it is a continued solve of that second's own goal.
 */
export namespace AutoMovieMotionHumanBendTrack {
  /** The wrist a primitive asks at a second. */
  export interface IGoal {
    /** The wrist's place, world metres. */
    point: IAutoMovieVector3;

    /**
     * The hand's world rotation from its rest; absent, the hand's turn adds no
     * strain.
     */
    rotation?: IAutoMovieQuaternion;
  }

  /** What the track is made of. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** Seconds since the action's start from which the primitive writes. */
    from: number;

    /**
     * Seconds since the action's start until which it writes; not before
     * `from`.
     */
    to: number;

    /**
     * The wrist asked on the posture so far at a second in [`from`, `to`]; a
     * pure function of both.
     */
    goal: (posture: IAutoMovieMotionHumanPosture, seconds: number) => IGoal;

    /** The preset `solve` returns where no elbow place is allowed. */
    fallback: PropsFallback;
  }

  /** A track's two readers, a primitive's `prepare` and its elbow. */
  export interface ITrack {
    /**
     * Solve the knots on the posture so far
     * (`IAutoMovieMotionHumanPrimitive.prepare`'s reader); called once, when
     * the action is planned.
     */
    prepare: (before: IAutoMovieMotionHumanPrimitive.Reader) => void;

    /**
     * The elbow's place at a second on the posture so far there, world metres,
     * usable as a bend hint; `asked` is the goal at that posture and second,
     * which the writer has already read.
     */
    elbow: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      asked: IGoal,
    ) => IAutoMovieVector3;
  }

  /**
   * Make a primitive's elbow track.
   *
   * The knots stand every `STEP` from `from`, and at `to`. A knot continued
   * from the one before it refines that one's swivel within one sweep step
   * either way (`hingedArmArticulation`'s `near`); where the refined swivel
   * lands within the refinement's resolution of that bracket's end the least
   * strain lies beyond it, so the continuation is made again from there,
   * walking the same basin, at most a full turn. A knot whose continuation
   * leaves the allowed places, or has no knot before it to continue, is solved
   * cold. A knot with no allowed place keeps none.
   *
   * A read continues from the two knots around its second, their swivels
   * interpolated linearly. Where a knot is missing, the two differ in bend
   * branch, the continued place is not allowed or no preparation was made, the
   * read is `AutoMovieMotionHumanBend.solve` itself, with the fallback.
   *
   * @param props The body, the arm, the span, the goal and the fallback.
   * @returns The track.
   */
  export function of(props: IProps): ITrack {
    const times: number[] = [];
    for (let k: number = 0; props.from + k * STEP < props.to; ++k)
      times.push(props.from + k * STEP);
    times.push(props.to);
    let knots: (IAutoMovieSwivelSeed | null)[] | undefined;

    const request: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => IAutoMovieMotionHumanBend.ISolve = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanBend.ISolve => ({
      body: props.body,
      posture,
      side: props.side,
      ...props.goal(posture, seconds),
      fallback: props.fallback,
    });

    // One allowed solve continued from a seed, and a knot's seed from the
    // knot before it, are the sequence's own steps (`AutoMovieMotionHumanBendWalk`).
    const continued: (
      solve: IAutoMovieMotionHumanBend.ISolve,
      seed: IAutoMovieSwivelSeed,
    ) => ISolved | null = (
      solve: IAutoMovieMotionHumanBend.ISolve,
      seed: IAutoMovieSwivelSeed,
    ): ISolved | null => AutoMovieMotionHumanBendWalk.walk(solve, seed);
    const knot: (
      solve: IAutoMovieMotionHumanBend.ISolve,
      last: IAutoMovieSwivelSeed | null,
    ) => IAutoMovieSwivelSeed | null = (
      solve: IAutoMovieMotionHumanBend.ISolve,
      last: IAutoMovieSwivelSeed | null,
    ): IAutoMovieSwivelSeed | null =>
      AutoMovieMotionHumanBendWalk.next(solve, last)?.seed ?? null;
    return {
      prepare: (before: IAutoMovieMotionHumanPrimitive.Reader): void => {
        const solved: (IAutoMovieSwivelSeed | null)[] = [];
        for (const t of times)
          solved.push(
            knot(request(before(t), t), solved[solved.length - 1] ?? null),
          );
        knots = solved;
      },
      elbow: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        asked: IGoal,
      ): IAutoMovieVector3 => {
        const solve: IAutoMovieMotionHumanBend.ISolve = {
          body: props.body,
          posture,
          side: props.side,
          ...asked,
          fallback: props.fallback,
        };
        if (knots === undefined) return AutoMovieMotionHumanBend.solve(solve);

        // The two knots around the second; the last interval ends at `to`,
        // which may be shorter than a step.
        const k: number = Math.max(
          0,
          Math.min(times.length - 2, Math.floor((seconds - props.from) / STEP)),
        );
        const next: number = Math.min(times.length - 1, k + 1);
        const a: IAutoMovieSwivelSeed | null = knots[k]!;
        const b: IAutoMovieSwivelSeed | null = knots[next]!;
        if (a === null || b === null || a.branch !== b.branch)
          return AutoMovieMotionHumanBend.solve(solve);
        const width: number = times[next]! - times[k]!;
        const share: number =
          width > 0
            ? Math.min(1, Math.max(0, (seconds - times[k]!) / width))
            : 0;
        const found: ISolved | null = continued(solve, {
          branch: a.branch,
          swivel: a.swivel + (b.swivel - a.swivel) * share,
        });
        return found === null
          ? AutoMovieMotionHumanBend.solve(solve)
          : found.candidate.elbow;
      },
    };
  }
}

/**
 * A search's candidate with the seed it was chosen at
 * (`AutoMovieMotionHumanBendSearch.continued`'s result when there is one).
 */
type ISolved = AutoMovieMotionHumanBendWalk.ISolved;

/**
 * The knots' spacing, seconds: the frame grid the planner's holds are sampled
 * on (`AutoMovieMotionHumanArmCourse.STEP`).
 */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;
