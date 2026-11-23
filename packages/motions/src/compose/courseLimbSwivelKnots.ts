import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import type { poseBones } from "../posture/poseBones";

/**
 * The knots of a swivel course (`courseLimbSwivels.swivels`): the limbs'
 * swivels and branches fitted at its seconds, the intervals between them and
 * the seeds a second between two knots takes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the records and the one reader of an interval.
 * @evidence contracts/development/design.md#principled-representation A limb on its goal has one free coordinate, its swivel, and a branch; a knot holds those at a second and an interval two knots.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knot, placement and interval records and the interpolation between two knots, read only by `courseLimbSwivels`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolver's own seeds; no pose is kept.
 */
export namespace courseLimbSwivelKnots {
  /**
   * The limbs' swivels and branches at one knot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation The resolver's own seeds at a second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by `courseLimbSwivels.swivels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose is kept.
   */
  export interface ISwivelKnot {
    /** The second, from the plan's start. */
    seconds: number;

    /** Each fitted limb's seed. */
    seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

    /** The coursed limbs the plan writes a goal for at this second; unknown for the entered knot. */
    held?: ReadonlySet<AutoMovieHumanLimb>;
  }

  /**
   * The limbs placed at given swivels at one second, as the course's
   * judgement reads them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation The bones where the swivels show and the seeds the resolver reported for the placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by `courseLimbSwivels.swivels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolver's own records; no pose is kept.
   */
  export interface IPlacement {
    /** The judged bones: each limb's mid and end joints and the point past its end. */
    bones: ReturnType<typeof poseBones>;

    /** Each fitted limb's seed as the resolver reported it. */
    seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
  }

  /**
   * An interval between two swivel knots, split where interpolation leaves the fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation A binary refinement over knot pairs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by `courseLimbSwivels.swivels`.
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

  /**
   * The seeds a second between two knots takes: each limb both knots fit on
   * one branch at its shortest-turn interpolation of their swivels, the
   * forearm's twist carried between them too; a limb whose branch changes or
   * whose goal ends inside the interval at the earlier knot's seed; and a
   * limb whose goal begins inside it (the plan writes it none at the earlier
   * knot) at the later knot's, the arm its goal starts from there.
   *
   * @param seconds The second, from the plan's start.
   * @param a The earlier knot.
   * @param b The later knot.
   * @returns Each limb's seed at the second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each limb takes and why.
   * @evidence contracts/development/implementation.md#principled-implementation The swivel is the one free coordinate of a two-bone limb on its goal; its shortest-turn interpolation between two fits on one branch moves the elbow continuously between them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One share, one pass over the earlier knot's limbs and one over the later knot's.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb is never interpolated across a branch change.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the knots' limbs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function between(
    seconds: number,
    a: ISwivelKnot,
    b: ISwivelKnot,
  ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> {
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
      // The forearm's twist is carried between the knots too, so the
      // placement between them continues it (`IAutoMovieSwivelSeed.twist`).
      const twist: number | undefined =
        from.twist === undefined
          ? undefined
          : to.twist === undefined
            ? from.twist
            : from.twist + (to.twist - from.twist) * share;
      out.set(limb, {
        swivel: from.swivel + unwrapped * share,
        branch: from.branch,
        ...(twist === undefined ? {} : { twist }),
      });
    }
    // A limb whose goal begins inside the interval takes the later knot's
    // placement.
    for (const [limb, to] of b.seeds)
      if (!out.has(limb) && a.held?.has(limb) === false) out.set(limb, to);
    return out;
  }
}
