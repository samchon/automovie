import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/**
 * The elbow of least strain of an arm a primitive writes over its span
 * (`AutoMovieMotionHumanBend.solve`), solved once when the action is planned
 * and continued through the span, in place of one cold search a posture
 * evaluation.
 *
 * The engine's swivel sweep is sized for a solve made once per authored
 * action (`hingedArmSwivel.STEP`). A primitive that asks `solve` in its
 * `write` makes it once per evaluated second instead. The track restores the
 * premise: on the frame grid the planner's holds are sampled on, from the
 * primitive's start, it keeps each knot's swivel and bend branch, the first
 * knot solved cold and each later one continued from the knot before it. A
 * read at any second continues from the seed interpolated between its two
 * knots, so the elbow is a function of the second alone, whatever order the
 * seconds are read in, and at every second it is a continued solve of that
 * second's own goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is tracked, the premise restored, the knots, how they are solved and what a read is.
 * @evidence contracts/development/design.md#principled-representation Plan data of one primitive: knots of a swivel in degrees and a branch on an action-local grid, with the goal a function of the posture so far and the second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record of inputs, one of the two readers a primitive needs, and the factory; read by the laws whose arm primitive solves its elbow.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law, body or side is named; the grid and the continuation's width are their owners'.
 */
export namespace AutoMovieMotionHumanBendTrack {
  /**
   * The wrist a primitive asks at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The part of `AutoMovieMotionHumanBend.ISolve` that varies over a span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rotation is absent exactly where `solve` takes none.
   */
  export interface IGoal {
    /** The wrist's place, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest; absent, the hand's turn adds no strain. */
    rotation?: IAutoMovieQuaternion;
  }

  /**
   * What the track is made of.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and frame.
   * @evidence contracts/development/design.md#principled-representation The fixed body and arm, the span and the goal over it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by the knots and the read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fallback is `solve`'s own, required because a track never throws on a frame.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** Seconds since the action's start from which the primitive writes. */
    from: number;

    /** Seconds since the action's start until which it writes; not before `from`. */
    to: number;

    /**
     * The wrist asked on the posture so far at a second in [`from`, `to`]; a pure function of both.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; the primitive that makes the track, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; the primitive that makes the track, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; the primitive that makes the track, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; the primitive that makes the track, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; the primitive that makes the track, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; the primitive that makes the track, which implements it, carries this claim.
     */
    goal: (posture: IAutoMovieMotionHumanPosture, seconds: number) => IGoal;

    /** The preset `solve` returns where no elbow place is allowed. */
    fallback: IAutoMovieMotionHumanBend.Arm | IAutoMovieMotionHumanBend.IShares;
  }

  /**
   * A track's two readers, a primitive's `prepare` and its elbow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states when it is called and what it gives.
   * @evidence contracts/development/design.md#principled-representation The plan's one preparation and its read, as `IAutoMovieMotionHumanPrimitive` separates them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both called by the primitive that owns the track.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A read before any preparation is the cold solve, not a guess.
   */
  export interface ITrack {
    /**
     * Solve the knots on the posture so far (`IAutoMovieMotionHumanPrimitive.prepare`'s reader); called once, when the action is planned.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `of`, which implements it, carries this claim.
     */
    prepare: (before: IAutoMovieMotionHumanPrimitive.Reader) => void;

    /**
     * The elbow's place at a second on the posture so far there, world metres, usable as a bend hint; `asked` is the goal at that posture and second, which the writer has already read.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `of`, which implements it, carries this claim.
     */
    elbow: (posture: IAutoMovieMotionHumanPosture, seconds: number, asked: IGoal) => IAutoMovieVector3;
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
   * leaves the allowed places, or has no knot before it to continue, is
   * solved cold. A knot with no allowed place keeps none.
   *
   * A read continues from the two knots around its second, their swivels
   * interpolated linearly. Where a knot is missing, the two differ in bend
   * branch, the continued place is not allowed or no preparation was made,
   * the read is `AutoMovieMotionHumanBend.solve` itself, with the fallback.
   *
   * @param props The body, the arm, the span, the goal and the fallback.
   * @returns The track.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the knots, the continuation and its walk, the cold cases, the read and its cold cases.
   * @evidence contracts/development/implementation.md#principled-implementation Numerical continuation of a minimiser along a parameter (the second): each solve starts from its neighbour's, so the elbow stays in one basin while that basin holds an allowed place, and the result depends on the second alone because the knots are solved once, in time order. Limitation: where the cold search would move to another basin of less strain while this one stays allowed, the track keeps this one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The knots' times, one knot's solve, the preparation's loop, the read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The grid is the planner's hold grid, the continuation's bracket and resolution the engine's (`hingedArmSwivel`), the walk's bound a full turn of that bracket; an unallowed continuation is never returned.
   * @evidence contracts/development/implementation.md#efficient-algorithms One cold search and one refinement a knot at preparation, more refinements only while a knot's swivel moves more than a step; one refinement a read. Driven by the span's knots and the seconds read. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The knots are shared by every read of the plan; they are a function of the action's own postures and goal, fixed once the action is planned.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The track keeps one seed a knot, `(to - from) / STEP + 2` at most, for the plan's life; no posture, reader or read result is kept.
   */
  export function of(props: IProps): ITrack {
    const times: number[] = [];
    for (let k: number = 0; props.from + k * STEP < props.to; ++k) times.push(props.from + k * STEP);
    times.push(props.to);
    let knots: (IAutoMovieSwivelSeed | null)[] | undefined;
    const hang: Parameters<typeof AutoMovieMotionHumanBendSearch.continued>[1] = (
      body: IAutoMovieMotionHumanBody,
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.hang(body, { root: { x: 0, y: 0, z: 0 }, yaw: 0 }, side);
    const request: (posture: IAutoMovieMotionHumanPosture, seconds: number) => IAutoMovieMotionHumanBend.ISolve = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanBend.ISolve => ({
      body: props.body,
      posture,
      side: props.side,
      ...props.goal(posture, seconds),
      fallback: props.fallback,
    });

    // One allowed solve continued from a seed, walked while the refinement
    // stops at its bracket's end; none when it leaves the allowed places.
    const continued: (solve: IAutoMovieMotionHumanBend.ISolve, seed: IAutoMovieSwivelSeed) => ISolved | null = (
      solve: IAutoMovieMotionHumanBend.ISolve,
      seed: IAutoMovieSwivelSeed,
    ): ISolved | null => {
      let near: IAutoMovieSwivelNear = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
      for (let walked: number = 0; walked * hingedArmSwivel.STEP <= 360; ++walked) {
        const found: ReturnType<typeof AutoMovieMotionHumanBendSearch.continued> =
          AutoMovieMotionHumanBendSearch.continued(solve, hang, near);
        if (typeof found === "string") return null;
        const moved: number = Math.abs(found.seed.swivel - near.swivel);
        if (moved < hingedArmSwivel.STEP - hingedArmSwivel.RESOLUTION)
          return found.candidate.overshoot === 0 ? found : null;
        near = { ...found.seed, tolerance: hingedArmSwivel.RESOLUTION };
      }
      return null;
    };

    // A knot's seed: continued from the knot before it, else cold; none
    // where no place is allowed. A cold swivel is read on the turn nearest
    // the knot before it, so two knots' swivels interpolate the short way.
    const knot: (solve: IAutoMovieMotionHumanBend.ISolve, last: IAutoMovieSwivelSeed | null) => IAutoMovieSwivelSeed | null = (
      solve: IAutoMovieMotionHumanBend.ISolve,
      last: IAutoMovieSwivelSeed | null,
    ): IAutoMovieSwivelSeed | null => {
      const kept: ISolved | null = last === null ? null : continued(solve, last);
      if (kept !== null) return kept.seed;
      const cold: ReturnType<typeof AutoMovieMotionHumanBendSearch.continued> =
        AutoMovieMotionHumanBendSearch.continued(solve, hang);
      if (typeof cold === "string" || cold.candidate.overshoot !== 0) return null;
      return last === null || last.branch !== cold.seed.branch
        ? cold.seed
        : {
            branch: cold.seed.branch,
            swivel: cold.seed.swivel - 360 * Math.round((cold.seed.swivel - last.swivel) / 360),
          };
    };
    return {
      prepare: (before: IAutoMovieMotionHumanPrimitive.Reader): void => {
        const solved: (IAutoMovieSwivelSeed | null)[] = [];
        for (const t of times)
          solved.push(knot(request(before(t), t), solved[solved.length - 1] ?? null));
        knots = solved;
      },
      elbow: (posture: IAutoMovieMotionHumanPosture, seconds: number, asked: IGoal): IAutoMovieVector3 => {
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
        const share: number = width > 0
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

/** A search's candidate with the seed it was chosen at (`AutoMovieMotionHumanBendSearch.continued`'s result when there is one). */
type ISolved = Exclude<ReturnType<typeof AutoMovieMotionHumanBendSearch.continued>, string>;

/** The knots' spacing, seconds: the frame grid the planner's holds are sampled on (`AutoMovieMotionHumanArmPlanned`, `AutoMovieMotionHumanArmFollow`). */
const STEP: number = 1 / 30;
