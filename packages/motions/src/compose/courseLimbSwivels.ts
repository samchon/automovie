import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { refitHumanPosture } from "../posture/refitHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { courseLimbSwivelKnots } from "./courseLimbSwivelKnots";

/**
 * The swivel-and-branch course of a plan's limb goals, read by a display that
 * keeps the goals and places each limb in closed form at the course's swivel
 * (`IAutoMovieSwivelNear.prescribed`, `courseLimbSwivels.swivels`).
 */
export namespace courseLimbSwivels {
  /** What a swivel course is fitted from. */
  export interface IPrepare {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The plan's posture, with its goals, at a second since the plan's start. */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

    /** The limbs whose swivels are coursed. */
    limbs: readonly AutoMovieHumanLimb[];

    /** The seconds since the plan's start the course covers. */
    span: ISpan;

    /**
     * Seconds inside the span the course keeps a knot at (the plan's events);
     * none when absent.
     */
    instants?: readonly number[];

    /**
     * Each limb's swivel and branch as the span is entered (the arm a display
     * showed at the cut into the plan), at which the first knot is placed; the
     * first knot is cold when absent.
     */
    entry?: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;
  }

  /** The seconds a course covers. */
  export interface ISpan {
    /** The first second, from the plan's start. */
    start: number;

    /** The last second. */
    end: number;
  }
  /**
   * The bones a limb's fit writes, in chain order, its end joint third.
   *
   * @param limb The limb.
   * @returns The upper and lower segment, the end joint, and a leg's toes.
   */
  export function chain(
    limb: AutoMovieHumanLimb,
  ): readonly AutoMovieHumanoidBone[] {
    switch (limb) {
      case "leftArm":
        return ["leftUpperArm", "leftLowerArm", "leftHand"];
      case "rightArm":
        return ["rightUpperArm", "rightLowerArm", "rightHand"];
      case "leftLeg":
        return ["leftUpperLeg", "leftLowerLeg", "leftFoot", "leftToes"];
      case "rightLeg":
        return ["rightUpperLeg", "rightLowerLeg", "rightFoot", "rightToes"];
    }
  }

  /** Each coursed limb's swivel and branch at a second. */
  export type Swivels = (
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

  /**
   * The swivel-and-branch course of a plan's limb goals, for a display that
   * keeps the goals and places each limb in closed form at the course's swivel
   * (`IAutoMovieSwivelNear.prescribed`).
   *
   * The course continues each limb's swivel, branch and forearm twist along
   * time, one knot after another (interval continuation: the swivel is the one
   * free coordinate of an arm on its goal, Tolani, Goswami and Badler 2000,
   * section 3.2.4, and its feasible arc moves with the goal). Its knots lie on
   * the frame grid (`AutoMovieMotionHumanArmCourse.STEP`) and at the plan's
   * instants. The first is placed at the swivels the limbs enter the span with
   * (`IPrepare.entry`), cold without them; every later one is a fit continuing
   * the knot just before it, so each knot is reached from its neighbour by the
   * continued fit's own bounded step and no knot depends on a farther one. The
   * other limbs a knot's resolve fits (a seated leg on its rest) continue the
   * knot before's fits too, so no knot after the first sweeps any limb. Where a
   * continued arm's admitted arc vanishes, its fit refuses (`HumanLimbFit`)
   * rather than jumping. A second between two knots lies on the minimum-jerk
   * path through the knots (Flash and Hogan 1985: a quintic between each two
   * whose position, velocity and acceleration carry across each knot,
   * `courseLimbSwivelKnots.rates` and `between`). The goals stay the displayed
   * ones; only the branch, swivel and twist come from the course, so no read
   * searches. The knots and the path through them are made in order when the
   * course is made, so a read only evaluates them and the course is the same in
   * any reading order.
   *
   * @param props The posture reader, the limbs, the span and the knotted
   *   instants.
   * @returns Each limb's swivel and branch at a second.
   */
  export function swivels(props: IPrepare): Swivels {
    const { body, posture: goals, limbs, span }: IPrepare = props;
    const near = (
      seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>,
      prescribed: boolean,
    ): Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> => {
      const out: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
      for (const [limb, seed] of seeds)
        out[limb] = {
          ...seed,
          tolerance: hingedArmSwivel.RESOLUTION,
          ...(prescribed ? { prescribed: true } : {}),
        };
      return out;
    };
    const fit = (
      seconds: number,
      from?: ISwivelKnot,
      prescribed: boolean = false,
    ): ISwivelKnot => {
      // A knot continues the knot just before it (its branch, swivel and
      // twist, refined, where they stay legal), the warm start a display
      // holds a limb's branch by.
      const posture: IAutoMovieMotionHumanPosture = goals(seconds);
      const continued: Partial<
        Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>
      > = from === undefined ? {} : near(from.seeds, prescribed);
      // Every other limb the knot before fitted (a seated leg on its rest, a
      // foot on a rail) continues that fit too, refined from its seed rather
      // than swept afresh at every knot; the course does not give it to the
      // display, whose legs keep their own fits.
      for (const [limb, seed] of from?.fits ?? [])
        if (
          continued[limb] === undefined &&
          !limbs.includes(limb) &&
          posture.limbs[limb] !== undefined
        )
          continued[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
      // A limb whose goal begins after the knot before (a hand laid on the
      // floor mid-turn, a fist taking its grip), the plan writing it no goal
      // there, has no fit there to continue: its fit starts from the swivel
      // and branch its arm has in the plan's own posture at this second,
      // its joints without the goal, refined from there as a continued knot
      // is, so the course takes the limb on from the arm the plan showed
      // rather than from a cold fit, which may take another solution of the
      // same goal (Tolani, Goswami and Badler 2000, section 3.2.4: the
      // feasible swivel nearest the reference). A limb whose goal the knot
      // before held but whose fit reported no seed there keeps its own fit.
      if (from !== undefined) {
        let shown: IAutoMoviePose | undefined;
        for (const limb of limbs) {
          if (
            continued[limb] !== undefined ||
            posture.limbs[limb] === undefined ||
            from.held?.has(limb) !== false
          )
            continue;
          shown ??= resolveHumanPosture(body, { ...posture, limbs: {} });
          const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
            body,
            shown,
            limb,
          );
          // The swivel and the branch only: the forearm's turn the goal's own
          // hand attitude fixes once the elbow is placed, and the shown arm's
          // turn is of a hand not yet on the goal.
          if (seed !== null)
            continued[limb] = {
              swivel: seed.swivel,
              branch: seed.branch,
              tolerance: hingedArmSwivel.RESOLUTION,
            };
        }
      }
      // A continued knot's seeds are the resolve's limb fits on the second's
      // assembly (`refitHumanPosture.constructed`); a cold one is the plain
      // resolve.
      let solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
      if (Object.keys(continued).length === 0)
        solved = resolveHumanPosture.seeded(body, posture);
      else {
        const assembly: resolveHumanPostureSource.IAssembled =
          resolveHumanPostureSource.assemble(body, posture);
        solved = refitHumanPosture.constructed(
          body,
          assembly.pose,
          assembly.limbs,
          continued,
        );
      }
      const seeds: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      // A held limb whose fit reports no seed here (its fit fell back to the
      // bend planes, the legal reach shell missed) keeps the knot before's
      // seed, the continuation the fallback's other solution must not break;
      // with none before, it is seeded by the swivel and branch its fitted arm
      // shows, read in closed form (`HumanLimbFit.seed`). So the course leaves
      // no second a read would fill from another solution, and the next knot
      // continues the arm, never cold.
      for (const limb of limbs) {
        const seed: IAutoMovieSwivelSeed | null | undefined =
          solved.seeds[limb] ??
          (posture.limbs[limb] === undefined
            ? undefined
            : (from?.seeds.get(limb) ??
              HumanLimbFit.seed(body, solved.pose, limb)));
        if (seed !== undefined && seed !== null) seeds.set(limb, seed);
      }
      const fits: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      for (const [limb, seed] of Object.entries(solved.seeds) as [
        AutoMovieHumanLimb,
        IAutoMovieSwivelSeed | null | undefined,
      ][])
        if (!limbs.includes(limb) && seed !== undefined && seed !== null)
          fits.set(limb, seed);
      return {
        seconds,
        seeds,
        fits,
        held: new Set<AutoMovieHumanLimb>(
          limbs.filter(
            (limb: AutoMovieHumanLimb): boolean =>
              posture.limbs[limb] !== undefined,
          ),
        ),
      };
    };

    // The knots' seconds: the frame grid from the span's start, the plan's
    // instants and the span's end.
    const step: number = AutoMovieMotionHumanArmCourse.STEP;
    const grid: number[] = [span.start, span.end];
    for (let k: number = 1; span.start + k * step < span.end - 1e-9; ++k)
      grid.push(span.start + k * step);
    for (const t of props.instants ?? [])
      if (t > span.start && t < span.end) grid.push(t);
    const times: readonly number[] = [...new Set<number>(grid)].sort(
      (x: number, y: number): number => x - y,
    );

    // The first knot places the limbs at the swivels they enter the span
    // with (prescribed: refined only where that placement does not stand),
    // so the course leaves the cut where the display showed the arm; each
    // knot after it continues the one before.
    const entered: ISwivelKnot | undefined =
      props.entry === undefined
        ? undefined
        : { seconds: span.start, seeds: props.entry };
    // Every knot is fitted here, in order, and the minimum-jerk path through
    // them (`courseLimbSwivelKnots.rates`, Flash and Hogan 1985) is prepared
    // over all of them: the course returned only evaluates them.
    const knots: ISwivelKnot[] = [];
    for (let i: number = 0; i < times.length; ++i)
      knots.push(
        i === 0 ? fit(times[0]!, entered, true) : fit(times[i]!, knots[i - 1]),
      );
    const rates: courseLimbSwivelKnots.Rates[] = courseLimbSwivelKnots.rates(
      knots,
      limbs,
    );
    return (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> => {
      const at: number = Math.min(Math.max(seconds, span.start), span.end);
      if (times.length === 1) return knots[0]!.seeds;
      let low: number = 0;
      let high: number = times.length - 1;
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (times[middle]! <= at) low = middle;
        else high = middle;
      }
      return courseLimbSwivelKnots.between(
        at,
        knots[low]!,
        knots[high]!,
        rates[low]!,
        rates[high]!,
      );
    };
  }

  /**
   * The limbs' swivels and branches at one knot
   * (`courseLimbSwivelKnots.ISwivelKnot`).
   */
  export type ISwivelKnot = courseLimbSwivelKnots.ISwivelKnot;
}
