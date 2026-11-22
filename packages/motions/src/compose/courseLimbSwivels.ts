import { Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";

/**
 * The swivel-and-branch course of a plan's limb goals, read by a display
 * that keeps the goals and places each limb in closed form at the course's
 * swivel (`IAutoMovieSwivelNear.prescribed`, `courseLimbSwivels.swivels`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the course and its reader.
 * @evidence contracts/development/design.md#principled-representation A limb on its goal has one free coordinate, its swivel, and a branch; the course holds those over the plan's seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader, its knot records and the limb chains it judges.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The goals stay the plan's and the display's own.
 */
export namespace courseLimbSwivels {
  /**
   * What a swivel course is fitted from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The body, the plan's goal posture by its seconds, the limbs, the span and its knotted instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the course reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The goals come from the reader.
   */
  export interface IPrepare {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The plan's posture, with its goals, at a second since the plan's start. */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

    /** The limbs whose swivels are coursed. */
    limbs: readonly AutoMovieHumanLimb[];

    /** The seconds since the plan's start the course covers. */
    span: ISpan;

    /** Seconds inside the span the course keeps a knot at (the plan's events); none when absent. */
    instants?: readonly number[];
  }

  /**
   * The seconds a course covers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each instant's unit.
   * @evidence contracts/development/design.md#principled-representation A start and an end on the plan's clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds, the plan's own clock.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and what each kind of limb lists.
   * @evidence contracts/development/implementation.md#principled-implementation The chain a limb fit solves, with the toes a foot contact's re-aim turns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal per limb.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No input is judged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * keeps the goals and places each limb in closed form at the course's
   * swivel (`IAutoMovieSwivelNear.prescribed`): each knot, at the span's
   * ends and the plan's instants, is the cold fit the display would show
   * there, so the course never drifts from it; between two knots of one
   * branch the swivel is interpolated, the interval split at its middle
   * where placing the limbs at the interpolated swivel puts an end joint
   * farther than the solver's tolerance from the middle's own fit, or where
   * the branch changes, down to the frame grid. The goals stay the displayed
   * ones; only the branch and swivel come from the course, so no read
   * searches and no branch hops.
   *
   * @param props The posture reader, the limbs, the span and the knotted instants.
   * @returns Each limb's swivel and branch at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is coursed, how it is read and judged, and why the goals stay.
   * @evidence contracts/development/implementation.md#principled-implementation The swivel is the one free coordinate of a two-bone limb on its goal; coursing it keeps the branch coherent while the closed form keeps the goal exact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Root knots in order, a recursive judgement, a descending read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every knot is a full resolve; interpolation is admitted against the solver's tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Knots only where the swivel path bends away from its interpolation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Knots and judgements are kept.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the reader and the knots.
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
    const fit = (seconds: number): ISwivelKnot => {
      const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        resolveHumanPosture.seeded(
          body,
          goals(seconds),
          undefined,
          // Every knot is the cold fit the display would show there, so the
          // course never drifts from it; between knots it is interpolated.
          {},
        );
      const seeds: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      for (const limb of limbs) {
        const seed: IAutoMovieSwivelSeed | null | undefined =
          solved.seeds[limb];
        if (seed !== undefined && seed !== null) seeds.set(limb, seed);
      }
      return { seconds, seeds };
    };
    const between = (
      seconds: number,
      a: ISwivelKnot,
      b: ISwivelKnot,
    ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> => {
      const share: number =
        b.seconds > a.seconds
          ? Math.min(
              1,
              Math.max(0, (seconds - a.seconds) / (b.seconds - a.seconds)),
            )
          : 0;
      const out: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      for (const [limb, from] of a.seeds) {
        const to: IAutoMovieSwivelSeed | undefined = b.seeds.get(limb);
        if (to === undefined || to.branch !== from.branch) {
          out.set(limb, from);
          continue;
        }
        const turn: number = to.swivel - from.swivel;
        const unwrapped: number = turn - 360 * Math.round(turn / 360);
        out.set(limb, {
          swivel: from.swivel + unwrapped * share,
          branch: from.branch,
        });
      }
      return out;
    };
    const placed = (
      seconds: number,
      seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>,
    ): ReturnType<typeof poseBones> =>
      poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          goals(seconds),
          undefined,
          near(seeds, true),
          undefined,
          ends,
        ).pose,
        undefined,
        ends,
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
    const root = (i: number): ISwivelKnot => {
      while (roots.length <= i) roots.push(fit(times[roots.length]!));
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
      const knot: ISwivelKnot = fit(middle);
      let split: boolean = [...a.seeds].some(
        ([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): boolean =>
          b.seeds.get(limb)?.branch !== seed.branch,
      );
      if (!split) {
        const interpolated: ReturnType<typeof poseBones> = placed(
          middle,
          between(middle, a, b),
        );
        const own: ReturnType<typeof poseBones> = placed(middle, knot.seeds);
        for (const bone of ends)
          if (
            Vector3.distance(
              interpolated.get(bone)!.worldPosition,
              own.get(bone)!.worldPosition,
            ) > tolerance
          )
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
    return (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> => {
      const at: number = Math.min(Math.max(seconds, span.start), span.end);
      if (times.length === 1) return root(0).seeds;
      let i: number = 0;
      while (i + 2 < times.length && times[i + 1]! <= at) ++i;
      let piece: ISwivelInterval | undefined = intervals.get(i);
      if (piece === undefined) {
        piece = { a: root(i), b: root(i + 1) };
        intervals.set(i, piece);
      }
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
   * The limbs' swivels and branches at one knot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation The resolver's own seeds at a second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by `swivels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose is kept.
   */
  export interface ISwivelKnot {
    /** The second, from the plan's start. */
    seconds: number;

    /** Each fitted limb's seed. */
    seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;
  }

  /**
   * An interval between two swivel knots, split where interpolation leaves the fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation A binary refinement over knot pairs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by `swivels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The split is decided once from the interval's own ends.
   */
  export interface ISwivelInterval {
    /** The knot at its start. */
    a: ISwivelKnot;

    /** The knot at its end. */
    b: ISwivelKnot;

    /** Its halves, where it was split; undefined until judged, null for a leaf. */
    halves?: readonly [ISwivelInterval, ISwivelInterval] | null;
  }
}
