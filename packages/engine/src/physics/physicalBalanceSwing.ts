import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieSamplePhysicalRecoveryGoal,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import type { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * The balance controller's swing phase (`advancePhysicalBalance`): each lifted
 * limb's landing re-predicted, its path sampled and its drive's feed-forward
 * asked for.
 *
 * The landing is re-predicted every step of the swing's first half from the
 * present capture point and the swing time left (Yin et al. 2007, Section
 * 3.3), by the same rules the step was chosen with: the remaining supports
 * holding their centre of pressure on their shrunken outline, the foot's
 * centre on the capture point at landing, on its own side and inside the new
 * support (`AutoMoviePhysicalBalance.assess`), its time that of the distance
 * from where it lifted (Khadiv et al. 2017, Section III-B); a diagonal pair as
 * that pair, both feet moved by one displacement. Past half the swing the
 * target and time are held, so the limb settles onto one place (Pratt et al.,
 * M2V2, Section VII-C1). A recovery swing's clearance is lowered to what the
 * stance can carry at its peak in the swing's time
 * (`physicalStanceBalance.clearance`), and is the sole's: a foot pitched so
 * its lowest point hangs further below its endpoint than when planted flat
 * has the endpoint raised by the difference (Pratt et al., M2V2, Section
 * VII-D1). The joints track the path with their own servos, within their
 * caps; the drive adds only the path's feed-forward through J^T
 * (`physicalStanceBalance.swingForce`).
 *
 * @param input The recovery's state after the plan phase, the body's
 *   readings, the stance read before the plan and the trace to record into, if
 *   any.
 * @returns The state with the landing re-predicted, a new one or the input
 *   itself; each lifted limb's endpoint goal; the drives to apply, in the
 *   swing's order; and the path the joints' reference fits (`trackPhysical`
 *   `BalanceTargets`). The input is never written.
 */
export function physicalBalanceSwing(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  stance: physicalBalanceStance.IStance;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalBalanceSwing.IResult {
  const { sense, stance } = input;
  let state: IAutoMoviePhysicalRecoveryState = input.state;
  const goals: Record<string, IAutoMovieVector3> = Object.create(null);
  const drives: physicalBalanceSwing.IDrive[] = [];
  if (!state.swing || stance.lifted.length === 0)
    return { state, goals, drives };
  const lifted: IAutoMovieStepPlanner.IStep[] = physicalRecoverySwing(state);
  const settling: boolean =
    sense.seconds - state.swing.start >=
    (state.swing.end - state.swing.start) / 2;
  if (!settling && stance.timing && sense.center.y - stance.plane > 0) {
    const froms: IAutoMovieVector3[] = lifted.map(
      (step: IAutoMovieStepPlanner.IStep): IAutoMovieVector3 => ({
        x: step.from.point[0],
        y: 0,
        z: step.from.point[1],
      }),
    );
    const patches: IAutoMoviePhysicalSupportPatch[] = lifted.map(
      (step: IAutoMovieStepPlanner.IStep, index: number) =>
        sense.footprint(sense.limb(step.bone), state, froms[index]!),
    );
    const flight: IAutoMoviePhysicalBalance.IResult = stance.ask(
      [...stance.planted, ...patches],
      [
        ...(sense.unavailable ?? []),
        ...sense.limbs
          .map((other: physicalBalanceSense.ILimb): string => other.bone)
          .filter(
            (other: string): boolean =>
              !lifted.some(
                (step: IAutoMovieStepPlanner.IStep): boolean =>
                  step.bone === other,
              ),
          ),
      ],
      true,
      {
        ...stance.timing,
        ramp: 0,
        elapsed: sense.seconds - state.swing.start,
      },
      lifted.length === 2 ? [lifted[0]!.bone, lifted[1]!.bone] : undefined,
    );
    const planned: IAutoMoviePhysicalBalance.IResult["step"] = flight.step;
    if (planned) {
      let steps: IAutoMoviePhysicalRecoveryState["steps"] = state.steps;
      const moved: IAutoMovieStepPlanner.IStep[] = lifted.map(
        (
          step: IAutoMovieStepPlanner.IStep,
          index: number,
        ): IAutoMovieStepPlanner.IStep => {
          const target: IAutoMovieVector3 | undefined =
            index === 0 ? planned.target : planned.pair?.target;
          if (!target) return step;
          const next: IAutoMovieStepPlanner.IStep = {
            ...step,
            to: {
              ...step.to,
              point: [
                target.x - (patches[index]!.position.x - froms[index]!.x),
                target.z - (patches[index]!.position.z - froms[index]!.z),
              ],
            },
            end: step.start + (planned.seconds ?? sense.policy.duration),
          };

          // The step's record follows its re-predicted place and time.
          const at: number = physicalRecoverySwing.record(steps, step.bone);
          if (at >= 0)
            steps = steps.map(
              (
                recorded: IAutoMoviePhysicalRecoveryState["steps"][number],
                index: number,
              ): IAutoMoviePhysicalRecoveryState["steps"][number] =>
                index === at
                  ? {
                      ...recorded,
                      to: { ...recorded.to, point: [...next.to.point] },
                      end: next.end,
                    }
                  : recorded,
            );
          return next;
        },
      );
      state = { ...state, swing: moved[0]!, steps };
      if (state.pair) state.pair = { ...state.pair, step: moved[1]! };
    }
  }
  const paths: { height: number; hang: number }[] = [];
  for (const swing of physicalRecoverySwing(state)) {
    const limb: physicalBalanceSense.ILimb = sense.limb(swing.bone);

    // The swinging limb's effective mass at its endpoint: the reaction its
    // path's acceleration asks of the stance (`physicalStanceBalance`
    // `.swingMass`).
    const carried: number = physicalStanceBalance.swingMass(
      sense.profile,
      sense.segments,
      limb,
    );
    const time: number = swing.end - swing.start;
    const rise: number = physicalStanceBalance.clearance(
      time,
      sense.profile.mass,
      carried,
      sense.gravity,
      sense.policy.height,
    );
    const motion: IAutoMovieSamplePhysicalRecoveryGoal.IResult =
      samplePhysicalRecoveryGoal({
        swing,
        point: sense.authored(swing.bone),
        velocity: sense.velocities?.[swing.bone] ?? { x: 0, y: 0, z: 0 },
        height: rise,
        seconds: sense.seconds,
      });
    const lowered: number = sense.hang(limb);
    const point: IAutoMovieVector3 = {
      ...motion.point,
      y: motion.point.y + lowered,
    };
    goals[swing.bone] = point;
    paths.push({ height: rise, hang: lowered });
    const position: IAutoMovieVector3 = sense.actual(swing.bone);
    const force: IAutoMovieVector3 = physicalStanceBalance.swingForce({
      mass: carried,
      gravity: sense.gravity,
      acceleration: motion.acceleration,
    });
    drives.push({ bone: swing.bone, point: position, force });
    input.trace?.push({
      kind: "swing",
      seconds: sense.seconds,
      bone: swing.bone,
      progress: (sense.seconds - swing.start) / time,
      duration: time,
      rise,
      hang: lowered,
      goal: { ...point },
      at: { ...position },
      goalVelocity: { ...motion.velocity },
      velocity: sense.segments.get(swing.bone)!.velocityAtPoint(position),
      force: { ...force },
    });
  }
  return {
    state,
    goals,
    drives,
    path: { ...paths[0]!, ...(paths[1] ? { pair: paths[1] } : {}) },
  };
}

/** What {@link physicalBalanceSwing} asks for. */
export namespace physicalBalanceSwing {
  /** A drive's feed-forward: a force at a lifted limb's endpoint, world newtons. */
  export interface IDrive {
    /** The limb's endpoint bone. */
    bone: string;
    /** Where the force acts, world metres. */
    point: IAutoMovieVector3;
    /** The force, world newtons. */
    force: IAutoMovieVector3;
  }

  /** The swing's result. */
  export interface IResult {
    /** The state after the swing phase. */
    state: IAutoMoviePhysicalRecoveryState;
    /** Each lifted limb's endpoint goal, world metres, by bone. */
    goals: Record<string, IAutoMovieVector3>;
    /** The drives to apply, in the swing's order. */
    drives: IDrive[];
    /** The swing's path as its drive takes it; absent while no limb swings. */
    path?: NonNullable<IAutoMovieAdvancePhysicalBalance.IResult["swing"]>;
  }
}
