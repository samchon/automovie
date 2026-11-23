import { Vector3, hingedArmSwivel } from "@automovie/engine";
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

import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { refitHumanPosture } from "../posture/refitHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { courseLimbJudgement } from "./courseLimbJudgement";
import { courseLimbSwivelKnots } from "./courseLimbSwivelKnots";

/**
 * The swivel-and-branch course of a plan's limb goals, read by a display
 * that keeps the goals and places each limb in closed form at the course's
 * swivel (`IAutoMovieSwivelNear.prescribed`, `courseLimbSwivels.swivels`).
 */
export namespace courseLimbSwivels {
  /**
   * What a swivel course is fitted from.
   */
  export interface IPrepare {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The plan's posture, with its goals, at a second since the plan's start.
     */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

    /** The limbs whose swivels are coursed. */
    limbs: readonly AutoMovieHumanLimb[];

    /** The seconds since the plan's start the course covers. */
    span: ISpan;

    /** Seconds inside the span the course keeps a knot at (the plan's events); none when absent. */
    instants?: readonly number[];

    /** Each limb's swivel and branch as the span is entered (the arm a display showed at the cut into the plan), at which the first knot is placed; the first knot is cold when absent. */
    entry?: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;
  }

  /**
   * The seconds a course covers.
   */
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

  /**
   * Each coursed limb's swivel and branch at a second.
   */
  export type Swivels = (
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

  /**
   * The swivel-and-branch course of a plan's limb goals, for a display that
   * keeps the goals and places each limb in closed form at the course's
   * swivel (`IAutoMovieSwivelNear.prescribed`): each knot, at the span's
   * ends and the plan's instants, is a full fit there, the first placed at
   * the swivels the limbs enter the span with (`IPrepare.entry`), cold
   * without them, and each later one continuing the knot before it (the middle of an interval
   * continues its start), so the course keeps a branch until it turns
   * infeasible and depends on the span alone; between two knots of one
   * branch the swivel is interpolated, the interval split at its middle
   * where placing the limbs at the interpolated swivel puts an end joint
   * farther than the solver's tolerance from the middle's own fit, where
   * that placement does not stand in closed form (a limb falls back to a
   * refine, or an arm pair that meets to its coupled solve), or where the
   * branch changes, down to the frame grid. The goals stay the displayed
   * ones; only the branch and swivel come from the course, so no read
   * searches and no branch hops. Each judgement is made once, the first time a read
   * descends through it, and kept.
   *
   * @param props The posture reader, the limbs, the span and the knotted instants.
   * @returns Each limb's swivel and branch at a second.
   */
  export function swivels(props: IPrepare): Swivels {
    const { body, posture: read, limbs, span }: IPrepare = props;
    // Each second's goal posture is read once: a knot's fit and the
    // judgement's two placements all read the same second.
    const postures: Map<number, IAutoMovieMotionHumanPosture> = new Map();
    const goals = (seconds: number): IAutoMovieMotionHumanPosture => {
      let found: IAutoMovieMotionHumanPosture | undefined =
        postures.get(seconds);
      if (found === undefined) {
        found = read(seconds);
        postures.set(seconds, found);
      }
      return found;
    };
    // A limb's interpolation is judged where its swivel shows: the elbow or
    // knee, the end joint, and a point past it (the hand's middle knuckle,
    // the toes), so a swivel that keeps the end joint on its goal but turns
    // the arm or the hand differently from the fit is split too.
    const ends: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(
        limbs.flatMap((limb: AutoMovieHumanLimb): AutoMovieHumanoidBone[] => [
          chain(limb)[1]!,
          chain(limb)[2]!,
          limb.endsWith("Arm")
            ? limb === "leftArm"
              ? "leftMiddleProximal"
              : "rightMiddleProximal"
            : chain(limb)[3]!,
        ]),
      );
    const tolerance: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;
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
      // The knots are chained from the span's start: the first is the
      // cold fit, or is placed at the entered swivels, and each later one continues the knot before it (its
      // branch and swivel, refined, where they stay legal), the warm
      // start a display holds a limb's branch by, so the course changes
      // branch only where the continued one turns infeasible. The chain
      // is fixed by the span and its instants, so no knot depends on the
      // order the course is read in. A continued knot's seeds are the
      // resolve's limb fits on the second's shared assembly; a cold one is
      // the plain resolve, which may take a prepared solve.
      const continued: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> =
        from === undefined ? {} : near(from.seeds, prescribed);
      // A limb whose goal begins after the knot before (a hand laid on the
      // floor mid-turn, a fist taking its grip), the plan writing it no goal
      // there, has no fit there to continue: its fit starts from the swivel
      // and branch its arm has in the plan's own posture at this second,
      // its joints without the goal, refined from there as a continued knot
      // is (the warm start a display holds a limb's branch by), so the
      // course takes the limb on from the arm the plan showed rather than
      // from a cold fit, which may take another solution of the same goal
      // (an elbow swung most of a half turn away); refined, not placed
      // exactly there, so the fit takes the feasible swivel nearest the
      // reference the plan's arm gives (Tolani, Goswami and Badler 2000,
      // section 3.2.4), which the plan's swivel itself is where it is
      // feasible. A limb whose goal the knot before held but
      // whose fit reported no seed there keeps its own fit.
      if (from !== undefined) {
        const posture: IAutoMovieMotionHumanPosture = goals(seconds);
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
      const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        Object.keys(continued).length === 0
          ? resolveHumanPosture.seeded(body, goals(seconds))
          : refitHumanPosture.constructed(
              body,
              assembled(seconds).pose,
              assembled(seconds).limbs,
              continued,
            );
      const seeds: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      for (const limb of limbs) {
        const seed: IAutoMovieSwivelSeed | null | undefined =
          solved.seeds[limb];
        if (seed !== undefined && seed !== null) seeds.set(limb, seed);
      }
      const written: IAutoMovieMotionHumanPosture["limbs"] =
        goals(seconds).limbs;
      lent = solved.pose;
      return {
        seconds,
        seeds,
        held: new Set<AutoMovieHumanLimb>(
          limbs.filter(
            (limb: AutoMovieHumanLimb): boolean => written[limb] !== undefined,
          ),
        ),
      };
    };
    const between: typeof courseLimbSwivelKnots.between =
      courseLimbSwivelKnots.between;
    // A second's assembly (the posture's root, heading and clamped direct
    // joints before any limb fit, `resolveHumanPosture.assemble`), made once
    // and shared by both placements judged there: a placement is the
    // resolve's second half alone.
    const assemblies: Map<number, resolveHumanPosture.IAssembled> = new Map();
    const assembled = (seconds: number): resolveHumanPosture.IAssembled => {
      let found: resolveHumanPosture.IAssembled | undefined =
        assemblies.get(seconds);
      if (found === undefined) {
        found = resolveHumanPosture.assemble(body, goals(seconds));
        assemblies.set(seconds, found);
      }
      return found;
    };
    // The limbs placed at given swivels: the posture's own goals fitted on
    // its assembly in the resolver's order (`refitHumanPosture.constructed`,
    // the kernel a full resolve runs after assembling), each coursed limb
    // prescribed, so it stands in closed form at its swivel (Tolani, Goswami
    // and Badler 2000, section 3.2.4) where it reaches its goal within range
    // and clear of what it keeps clear of. The digits a full resolve fits
    // last are left out: a judged knuckle is the proximal joint's origin,
    // which only the hand's own frame places.
    // The last fitted knot's pose, lent to the judgement that made it.
    let lent: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["pose"] | undefined;
    const placed = (
      seconds: number,
      seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>,
      pinned?: IAutoMovieMotionHumanPosture["limbs"],
    ): IPlacement => {
      const assembly: resolveHumanPosture.IAssembled = assembled(seconds);
      const resolved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        refitHumanPosture.constructed(
          body,
          assembly.pose,
          pinned ?? assembly.limbs,
          near(seeds, true),
        );
      return {
        bones: poseBones(body, resolved.pose, undefined, ends),
        seeds: resolved.seeds,
      };
    };

    // Whether every limb stands where it was prescribed: the closed form
    // places a limb at its prescribed swivel and branch and reports exactly
    // that seed, so another seed means the placement fell back (out of reach
    // or range, through what the limb keeps clear of, or an arm pair whose
    // coupled solve took over because the placed arms meet).
    const stands = (
      prescribed: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>,
      placement: IPlacement,
    ): boolean =>
      [...prescribed].every(
        ([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): boolean => {
          const got: IAutoMovieSwivelSeed | null | undefined =
            placement.seeds[limb];
          return (
            !!got &&
            got.branch === seed.branch &&
            Math.abs(got.swivel - seed.swivel) <= 1e-9
          );
        },
      );
    const times: readonly number[] = [
      ...new Set<number>([
        span.start,
        ...(props.instants ?? []).filter(
          (t: number): boolean => t > span.start && t < span.end,
        ),
        span.end,
      ]),
    ].sort((x: number, y: number): number => x - y);
    const roots: ISwivelKnot[] = [];
    // The first knot places the limbs at the swivels they enter the span
    // with (prescribed: refined only where that placement does not stand),
    // so the course leaves the cut where the display showed the arm; the
    // knots after it continue it, and the interpolation between eases the
    // arm from there.
    const entered: ISwivelKnot | undefined =
      props.entry === undefined
        ? undefined
        : { seconds: span.start, seeds: props.entry };
    const root = (i: number): ISwivelKnot => {
      while (roots.length <= i)
        roots.push(
          roots.length === 0
            ? fit(times[0]!, entered, true)
            : fit(times[roots.length]!, roots[roots.length - 1]),
        );
      return roots[i]!;
    };
    const intervals: Map<number, ISwivelInterval> = new Map();
    const halves = (
      piece: ISwivelInterval,
    ): readonly [ISwivelInterval, ISwivelInterval] | null => {
      if (piece.halves !== undefined) return piece.halves;
      const { a, b }: ISwivelInterval = piece;
      if (b.seconds - a.seconds <= AutoMovieMotionHumanArmCourse.STEP) {
        piece.halves = null;
        return null;
      }
      const middle: number = (a.seconds + b.seconds) / 2;
      const knot: ISwivelKnot = fit(middle, a);
      // A branch change, a goal that ends or a goal that begins inside the
      // interval is split down to the frame grid.
      let split: boolean =
        [...a.seeds].some(
          ([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): boolean =>
            b.seeds.get(limb)?.branch !== seed.branch,
        ) ||
        [...b.seeds.keys()].some(
          (limb: AutoMovieHumanLimb): boolean =>
            !a.seeds.has(limb) && a.held?.has(limb) === false,
        );
      if (!split) {
        const swivels: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
          between(middle, a, b);
        // The middle's own fit as it stands, and the interpolated swivels
        // placed on its end joints, clearance probed (`courseLimbJudgement`).
        const own: IPlacement = {
          bones: poseBones(body, lent!, undefined, ends),
          seeds: Object.fromEntries(knot.seeds),
        };
        const interpolated: IPlacement = placed(
          middle,
          swivels,
          courseLimbJudgement(body, assembled(middle), limbs, (l: AutoMovieHumanLimb): AutoMovieHumanoidBone => chain(l)[2]!, own.bones),
        );
        for (const bone of ends)
          if (
            Vector3.distance(
              interpolated.bones.get(bone)!.worldPosition,
              own.bones.get(bone)!.worldPosition,
            ) > tolerance
          )
            split = true;

        // An interpolation the display could not place in closed form, a
        // coupled arm pair's above all, is split too where the middle's own
        // fit stands there, so the fallback's own solve lands on a knot once
        // rather than at every displayed second. Where not even the own fit
        // stands (a goal out of reach or range), a knot would not help.
        if (!stands(swivels, interpolated) && stands(knot.seeds, own))
          split = true;
      }
      piece.halves = split
        ? [
            { a, b: knot },
            { a: knot, b },
          ]
        : null;
      return piece.halves;
    };

    // A root interval is made the first time a read lands in it, and judged
    // only along the path a read descends: an interval no read reaches is
    // never judged. Each judgement reads only its interval's two ends and is
    // kept, so the course is the same in any reading order.
    const baked = (i: number): ISwivelInterval => {
      let piece: ISwivelInterval | undefined = intervals.get(i);
      if (piece === undefined) {
        piece = { a: root(i), b: root(i + 1) };
        intervals.set(i, piece);
      }
      return piece;
    };
    return (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> => {
      const at: number = Math.min(Math.max(seconds, span.start), span.end);
      if (times.length === 1) return root(0).seeds;
      let i: number = 0;
      while (i + 2 < times.length && times[i + 1]! <= at) ++i;
      let piece: ISwivelInterval = baked(i);
      for (
        let split: readonly [ISwivelInterval, ISwivelInterval] | null =
          halves(piece);
        split !== null;
        split = halves(piece)
      )
        piece = at < split[0].b.seconds ? split[0] : split[1];
      return between(at, piece.a, piece.b);
    };
  }

  /**
   * The limbs' swivels and branches at one knot (`courseLimbSwivelKnots.ISwivelKnot`).
   */
  export type ISwivelKnot = courseLimbSwivelKnots.ISwivelKnot;

  /**
   * The limbs placed at given swivels at one second (`courseLimbSwivelKnots.IPlacement`).
   */
  export type IPlacement = courseLimbSwivelKnots.IPlacement;

  /**
   * An interval between two swivel knots (`courseLimbSwivelKnots.ISwivelInterval`).
   */
  export type ISwivelInterval = courseLimbSwivelKnots.ISwivelInterval;
}
