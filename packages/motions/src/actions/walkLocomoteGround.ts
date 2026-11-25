import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { WALK_TICK } from "./WALK_TICK";
import { runStance } from "./runStance";
import { walkDescent } from "./walkDescent";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import { walkLocomoteLowering } from "./walkLocomoteLowering";
import { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkReach } from "./walkReach";
import { walkReachGround } from "./walkReachGround";
import { walkSupportHeight } from "./walkSupportHeight";
import { walkSwing } from "./walkSwing";

/** The already evaluated pelvis at the current action second. */
interface IReachAt {
  /** The action second it was evaluated at. */
  seconds: number;

  /** The pelvis there. */
  pelvis: walkReach.IPelvis;
}

/** The two scheduled feet at an action second. */
type Feet = Record<
  AutoMovieHumanSide,
  IAutoMovieMotionHumanWalkFoot.IScheduled
>;

/** The pelvis's three joint angles at an action second, degrees. */
type Hips = readonly [number, number, number];

/** A posture read's optional FK source. */
type Resolution = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

/**
 * A stepping gait's pelvis settled against its stances: every swing's flight
 * claim, scheduled descent and stance ends are constants of the step, settled
 * once in toe-off order as the walk is planned, so a read settles only its own
 * second.
 */
export namespace walkLocomoteGround {
  /** What the settling reads of the walk's plan. */
  export interface IContext {
    /** The plan's fixed body. */
    body: IAutoMovieMotionHumanBody;

    /** The gait. */
    gait: IAutoMovieMotionHumanWalkGait;

    /** The walk's step schedule. */
    steps: IAutoMovieMotionHumanWalkSteps.IPlan;

    /** The pelvis path, at its support height when a walk bounds it. */
    root: IAutoMovieMotionHumanWalkSteps.IPlan["root"];

    /** The pelvis's joint angles at a second, its stride phase and amount. */
    pelvis: (t: number, phase?: number, amount?: number) => Hips;

    /** The body's two-link knee-floor bound. */
    claim: ReturnType<typeof walkReach.prepareShort>;

    /** A walk's bounded support height and landing claims; none otherwise. */
    support: ReturnType<typeof walkSupportHeight> | undefined;

    /** The swings as the schedule alone has them. */
    scheduled: ReturnType<typeof walkSwing>;
  }

  /** The settled pelvis of a walk. */
  export interface IGround {
    /**
     * Settle the pelvis at a second.
     *
     * @param t Action seconds.
     * @param feet The scheduled feet there.
     * @param amount How much the body is walking there.
     * @param hips The pelvis's joint angles there.
     * @param resolution The read's optional FK source.
     * @returns The settled pelvis and feet.
     */
    settle(
      t: number,
      feet: Feet,
      amount?: number,
      hips?: Hips,
      resolution?: Resolution,
    ): walkReach.IGround;

    /**
     * A foot's settled stance at one of the swings' prepared ends.
     *
     * @param side The foot.
     * @param t The end's action second.
     * @returns The settled foot there.
     */
    end(side: AutoMovieHumanSide, t: number): walkFoot.IEnd;
  }

  /**
   * A foot as its schedule alone has it, before any pelvis is settled.
   *
   * @param foot The scheduled foot.
   * @returns Its ankle, rotation and toes.
   */
  export function scheduled(
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ): walkFoot.IEnd {
    return {
      ankle: foot.placement.ankle,
      rotation: foot.placement.rotation,
      toes: foot.toes,
    };
  }

  /**
   * Prepare the settling of a walk's pelvis. In toe-off order each swing's
   * stance ends a tick and two ticks before it leaves are settled, then its
   * flight claim (a run's) or its scheduled descent (a gait whose support
   * height is not bounded); every swing's landing and the other foot's stance
   * at its mid-swing are settled after. A stance is settled at an earlier
   * second than the swing it departs into, so each settle reads only swings
   * already prepared.
   *
   * @param context What the settling reads of the walk's plan.
   * @param swings Every swing of the plan in toe-off order.
   * @returns The settled pelvis at any second and the swings' settled ends.
   */
  export function prepare(
    context: IContext,
    swings: readonly walkLocomoteSwings.ISwing[],
  ): IGround {
    const flights: Map<string, [number, number]> = new Map();
    const descents: Map<string, walkDescent.IPlan> = new Map();
    const ends: Map<string, walkFoot.IEnd> = new Map();
    const settle: IGround["settle"] = (
      t: number,
      feet: Feet,
      amount: number = context.steps.amount(t),
      hips: Hips = context.pelvis(t, context.steps.phase(t), amount),
      resolution?: Resolution,
    ): walkReach.IGround =>
      ground(context, flights, descents, t, feet, amount, hips, resolution);
    const settleEnd: (side: AutoMovieHumanSide, t: number) => void = (
      side: AutoMovieHumanSide,
      t: number,
    ): void => {
      ends.set(
        `${side}:${t}`,
        settle(t, {
          left: context.steps.foot("left", t),
          right: context.steps.foot("right", t),
        }).feet[side],
      );
    };
    const end: IGround["end"] = (
      side: AutoMovieHumanSide,
      t: number,
    ): walkFoot.IEnd => {
      const settled: walkFoot.IEnd | undefined = ends.get(`${side}:${t}`);
      if (settled === undefined)
        throw new Error(
          `walkLocomoteGround: no ${side} stance end is prepared at ${t} s.`,
        );
      return settled;
    };
    for (const swing of swings) {
      settleEnd(swing.side, swing.off - WALK_TICK);
      settleEnd(swing.side, swing.off - 2 * WALK_TICK);
      // A foot in flight bears nothing: it claims what its stance claimed
      // when it left and what the next claims when it lands, blended. What
      // its stance claimed is its settled stance's, a tick before the
      // toe-off as the swing departs from it (`walkSwing`): the schedule's
      // toe-off ankle stands below the heel the stance's rule raises, and
      // claimed from it the pelvis dropped at every toe-off.
      if (context.gait.swing > 1) {
        const sampled: ReturnType<typeof preparePoseResolution> =
          preparePoseResolution();
        flights.set(`${swing.side}:${swing.off}`, [
          reaching(
            context,
            swing.side,
            swing,
            0,
            sampled,
            undefined,
            end(swing.side, swing.off - WALK_TICK).ankle,
          ),
          reaching(context, swing.side, swing, 1, sampled),
        ]);
      } else if (context.support === undefined) {
        const sampled: ReturnType<typeof preparePoseResolution> =
          preparePoseResolution();
        descents.set(
          `${swing.side}:${swing.off}`,
          walkDescent.plan((u: number): number =>
            reaching(context, swing.side, swing, u, sampled),
          ),
        );
      }
    }
    for (const swing of swings) {
      settleEnd(swing.side, swing.on);
      settleEnd(
        swing.side === "left" ? "right" : "left",
        (swing.off + swing.on) / 2,
      );
    }

    // The root's lowering, the one quantity a read would search for, solved
    // here at knots AutoKnots places between the toe-offs and heel strikes
    // (`walkLocomoteLowering.prepare`) and read between them from their
    // course, so a read places the stances under it with no root search.
    // Each knot's exact settling, read by both courses: kept for this
    // preparation alone.
    const solved: Map<number, walkReach.IGround> = new Map();
    const exact = (t: number): walkReach.IGround => {
      const known: walkReach.IGround | undefined = solved.get(t);
      if (known !== undefined) return known;
      const amount: number = context.steps.amount(t);
      const out: walkReach.IGround = ground(
        context,
        flights,
        descents,
        t,
        {
          left: context.steps.foot("left", t),
          right: context.steps.foot("right", t),
        },
        amount,
        context.pelvis(t, context.steps.phase(t), amount),
        undefined,
      );
      solved.set(t, out);
      return out;
    };
    const lowering: (seconds: number) => number[] =
      walkLocomoteLowering.prepare(
        context.steps.duration,
        swings,
        (t: number): number => context.root(t).y - exact(t).root.y,
      );
    // Each foot's stance pitch, the heel-rise search a read would make,
    // solved the same way between that foot's own contact events.
    const pitches: (seconds: number) => Record<AutoMovieHumanSide, number> =
      walkLocomoteLowering.prepareStances(
        context.steps.duration,
        swings,
        context.body.measure.footLength,
        (t: number): Record<AutoMovieHumanSide, number> => exact(t).pitches,
      );
    return {
      settle: (
        t: number,
        feet: Feet,
        amount: number = context.steps.amount(t),
        hips: Hips = context.pelvis(t, context.steps.phase(t), amount),
        resolution?: Resolution,
      ): walkReach.IGround =>
        walkLocomoteLowering.placed(
          context,
          t,
          feet,
          amount,
          hips,
          resolution,
          lowering(t)[0]!,
          pitches(t),
        ),
      end,
    };
  }
}

/**
 * Settle the pelvis at a second from the prepared swing claims.
 *
 * @param context What the settling reads of the walk's plan.
 * @param flights Each running swing's claims at its two ends.
 * @param descents Each swing's scheduled descent.
 * @param t Action seconds.
 * @param feet The scheduled feet there.
 * @param amount How much the body is walking there.
 * @param hips The pelvis's joint angles there.
 * @param resolution The read's optional FK source.
 * @returns The settled pelvis and feet.
 */
function ground(
  context: walkLocomoteGround.IContext,
  flights: ReadonlyMap<string, [number, number]>,
  descents: ReadonlyMap<string, walkDescent.IPlan>,
  t: number,
  feet: Feet,
  amount: number,
  hips: Hips,
  resolution: Resolution,
): walkReach.IGround {
  const read: ReturnType<typeof preparePoseResolution> | undefined =
    resolution === undefined
      ? undefined
      : prepareHumanPoseResolution.read(resolution);
  const root: IAutoMovieVector3 = context.root(t);
  const frame: walkReach.IPelvis = walkReach.pelvis(
    context.body,
    root,
    context.steps.yaw(t),
    hips,
    feet,
    read,
  );
  const current: IReachAt = { seconds: t, pelvis: frame };
  const claims: Partial<Record<AutoMovieHumanSide, number>> = {};
  for (const side of ["left", "right"] as const) {
    const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
      feet[side].swing;
    if (swing === undefined) continue;
    if (context.gait.swing > 1) {
      claims[side] = runStance.airborne(
        prepared(flights, side, swing),
        swing.u,
      );
      continue;
    }
    if (swing.u < walkDescent.START) continue;
    // The airborne ankle does not lower its support. Transfer only the
    // lowering the landing foot actually needs at the instant of strike.
    if (context.support !== undefined) {
      const weight: number = walkReach.weight(feet[side]);
      const landing: number =
        weight === 0 ? 0 : context.support.landing(side, swing.on);
      claims[side] = -walkReach.CLAIM + weight * (landing + walkReach.CLAIM);
      continue;
    }
    claims[side] = walkDescent.claim(
      prepared(descents, side, swing),
      swing.u,
      reaching(context, side, swing, swing.u, read, current),
      -walkReach.CLAIM,
    );
  }
  return walkReachGround(
    context.body,
    root,
    frame,
    feet,
    claims,
    // The forefoot rocker is a stepping foot's: it comes in with the gait and goes with it, so a walk stands flat where it starts and stops.
    walkLeg.ROCKER * amount,
  );
}

/**
 * A swing's prepared constant, kept by its foot and toe-off.
 *
 * @param table The prepared constants.
 * @param side The swinging foot.
 * @param swing The swing.
 * @returns Its constant.
 */
function prepared<T>(
  table: ReadonlyMap<string, T>,
  side: AutoMovieHumanSide,
  swing: Pick<walkLocomoteSwings.ISwing, "off">,
): T {
  const value: T | undefined = table.get(`${side}:${swing.off}`);
  if (value === undefined)
    throw new Error(
      `walkLocomoteGround: the ${side} swing from ${swing.off} s is not prepared.`,
    );
  return value;
}

/**
 * The lowering a swinging leg asks of the pelvis at a share of its swing for
 * the ankle the schedule swings there, read from the schedule alone so that it
 * needs no settled pelvis and every instant settles the same.
 *
 * @param context What the settling reads of the walk's plan.
 * @param side The swinging foot.
 * @param swing The swing's toe-off and heel strike.
 * @param u The share of the swing.
 * @param resolution The FK reader.
 * @param current The pelvis already evaluated at the read's second.
 * @param ankle The ankle the claim is read for; the scheduled swing's when
 *   absent.
 * @returns The lowering, metres.
 */
function reaching(
  context: walkLocomoteGround.IContext,
  side: AutoMovieHumanSide,
  swing: Pick<walkLocomoteSwings.ISwing, "off" | "on">,
  u: number,
  resolution?: ReturnType<typeof preparePoseResolution>,
  current?: IReachAt,
  ankle?: IAutoMovieVector3,
): number {
  const t: number = swing.off + u * (swing.on - swing.off);
  const frame: walkReach.IPelvis =
    current?.seconds === t
      ? current.pelvis
      : walkReach.pelvis(
          context.body,
          context.root(t),
          context.steps.yaw(t),
          context.pelvis(t),
          {
            left: context.steps.foot("left", t),
            right: context.steps.foot("right", t),
          },
          resolution,
        );
  return context.claim(
    frame.hips[side],
    ankle ?? context.scheduled(side, swing)(u).placement.ankle,
  );
}
