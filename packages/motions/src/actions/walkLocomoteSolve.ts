import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";
import { walkFoot } from "./walkFoot";
import { walkLocomoteGround } from "./walkLocomoteGround";
import { walkLocomoteLowering } from "./walkLocomoteLowering";
import { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkPosture } from "./walkPosture";
import { walkReach } from "./walkReach";
import { walkSwing } from "./walkSwing";


/** A leg's swing kept inside its ranges under a settled pelvis. */
type Ranged = ReturnType<typeof walkReach.prepareSwing>;

/**
 * A stepping gait's legs at a second: the pelvis settled against the stances
 * and each swinging foot reached inside its leg's ranges under it, the running
 * swings holding the reach of the stance they leave, settled once per swing as
 * the walk is planned.
 */
export namespace walkLocomoteSolve {
  /** What the legs read of the walk's plan. */
  export interface IContext {
    /** The plan's fixed body. */
    body: IAutoMovieMotionHumanBody;

    /** The gait. */
    gait: IAutoMovieMotionHumanWalkGait;

    /** The walk's step schedule. */
    steps: IAutoMovieMotionHumanWalkSteps.IPlan;

    /** The pelvis's joint angles at a second, its stride phase and amount. */
    pelvis: walkLocomoteGround.IContext["pelvis"];

    /** The pelvis settled against the stances. */
    ground: walkLocomoteGround.IGround;

    /** The swings joining their settled stance ends. */
    reached: ReturnType<typeof walkSwing>;
  }

  /**
   * Prepare the legs' solve: both legs' range readers, the footfalls taken in
   * place at the arrival, and each running swing's departure excess, how far
   * its leg's reach moves the stance it leaves, settled at its toe-off.
   *
   * @param context What the legs read of the walk's plan.
   * @param swings Every swing of the plan.
   * @returns The solve of the legs at a second.
   */
  export function prepare(
    context: IContext,
    swings: readonly walkLocomoteSwings.ISwing[],
  ): Parameters<typeof walkPosture>[5] {
    const { body, gait, steps }: IContext = context;
    const ranged: Record<AutoMovieHumanSide, Ranged> = {
      left: walkReach.prepareSwing(body, "left"),
      right: walkReach.prepareSwing(body, "right"),
    };
    // The landings of footfalls taken in place at the arrival, by foot and heel strike.
    const turning: ReadonlySet<string> = new Set(
      steps.stances
        .filter(
          (s: IAutoMovieMotionHumanWalkSteps.IStance): boolean =>
            s.inPlace === true,
        )
        .map(
          (s: IAutoMovieMotionHumanWalkSteps.IStance): string =>
            `${s.side}:${s.from}`,
        ),
    );
    // A running swing holds its reach from the stance it leaves: a constant
    // of the step, kept by its foot and toe-off.
    const leavings: Map<string, IAutoMovieVector3> = new Map();
    if (gait.swing > 1)
      for (const swing of swings) {
        const departure: IAutoMovieMotionHumanWalkFoot.IFoot = context.reached(
          swing.side,
          swing,
        )(0);
        leavings.set(
          `${swing.side}:${swing.off}`,
          Vector3.subtract(
            ranged[swing.side](
              context.ground.settle(swing.off, {
                left: steps.foot("left", swing.off),
                right: steps.foot("right", swing.off),
              }),
              departure,
            ).ankle,
            departure.placement.ankle,
          ),
        );
      }
    // Each swing's floor-clearing lift, the one search of a swing's read,
    // solved at knots AutoKnots places over the swing's share (Vitenti et
    // al. 2024, arXiv:2412.13423) to the lowering's millimetre
    // (`walkLocomoteLowering.TOLERANCE`), split at the edges of the reach
    // ranges' fades (`walkReach.FADE`), where the ranges' rule changes, and
    // read between them from a knot course (`prepareHumanSampledCourse`); a
    // read then raises the foot only by what still sinks (closed form).
    const lifts: Map<string, (u: number) => number[]> = new Map();
    for (const swing of swings)
      lifts.set(
        `${swing.side}:${swing.off}`,
        prepareHumanSampledCourse({
          from: 0,
          to: 1,
          marks: [walkReach.FADE, 1 - walkReach.FADE],
          sample: (u: number): number[] => {
            const t: number = swing.off + u * (swing.on - swing.off);
            return [
              ranged[swing.side](
                context.ground.settle(t, {
                  left: steps.foot("left", t),
                  right: steps.foot("right", t),
                }),
                context.reached(swing.side, swing)(u),
              ).lift,
            ];
          },
          tolerance: {
            kind: "absolute",
            absolute: walkLocomoteLowering.TOLERANCE,
          },
          step: AutoMovieMotionHumanArmCourse.STEP / (swing.on - swing.off),
        }),
      );
    return (
      t: number,
      legs: readonly AutoMovieHumanSide[],
      phase: number,
      amount: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): walkPosture.ISettled => {
      const feet: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanWalkFoot.IScheduled
      > = {
        left: steps.foot("left", t),
        right: steps.foot("right", t),
      };
      const hips: readonly [number, number, number] = context.pelvis(
        t,
        phase,
        amount,
      );
      const settled: walkReach.IGround = context.ground.settle(
        t,
        feet,
        amount,
        hips,
        resolution,
      );
      const reached: Record<AutoMovieHumanSide, walkFoot.IEnd> = {} as Record<
        AutoMovieHumanSide,
        walkFoot.IEnd
      >;
      for (const side of ["left", "right"] as const) {
        const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
          feet[side].swing;
        if (!legs.includes(side)) {
          reached[side] = walkLocomoteGround.scheduled(feet[side]);
          continue;
        }
        if (swing === undefined) {
          reached[side] = settled.feet[side];
          continue;
        }
        reached[side] = ranged[side](
          settled,
          context.reached(side, swing)(swing.u),
          // The bounds fade in from the stance left, which a turning pelvis can
          // leave outside them; the stance reached is settled inside them, so a
          // walk's swing keeps them to its landing. A turn in place, or a
          // footfall taken in place at the arrival, lands with the leg folded
          // under the turning body, where those ranges and the stance's rockers
          // disagree: it fades both, so it lands on the stance it reaches.
          steps.inPlace === true || turning.has(`${side}:${swing.on}`)
            ? swing.u
            : Math.min(swing.u, 0.5),
          gait.swing > 1 ? leaving(leavings, side, swing.off) : undefined,
          Math.max(0, lifts.get(`${side}:${swing.off}`)?.(swing.u)[0] ?? 0),
        );
      }
      return { feet, hips, settled, reached };
    };
  }
}

/**
 * A running swing's prepared departure excess.
 *
 * @param leavings The excesses by foot and toe-off.
 * @param side The swinging foot.
 * @param off Its toe-off, action seconds.
 * @returns The excess, world metres.
 */
function leaving(
  leavings: ReadonlyMap<string, IAutoMovieVector3>,
  side: AutoMovieHumanSide,
  off: number,
): IAutoMovieVector3 {
  const excess: IAutoMovieVector3 | undefined = leavings.get(`${side}:${off}`);
  if (excess === undefined)
    throw new Error(
      `walkLocomoteSolve: the ${side} swing from ${off} s is not prepared.`,
    );
  return excess;
}
